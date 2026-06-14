import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import pagination from "../../Shared/Pagination";

let registeredViolationsRecords = {};
registeredViolationsRecords.pageIndex = 1;
registeredViolationsRecords.destroyTable = false;

registeredViolationsRecords.getRegisteredViolations = (
  pageIndex = 1,
  destroyTable = false,
  ViolationType = Number($("#TypeofViolation").children("option:selected").data("id")),
  ViolationGeneralSearch = $("#violationSearch").val()
) => {
  let UserId = _spPageContextInfo.userId;

  // Check if theCode field has a value but violationCategory is empty
  const theCodeValue = $("#theCode").val();
  const violationCategoryValue = $("#violationCategory").val();

  if (theCodeValue && theCodeValue.trim() !== "" && (!violationCategoryValue || violationCategoryValue === "")) {
    functions.warningAlert("من فضلك قم باختيار تصنيف المخالفة قبل إدخال رقم المحجر/عربة/معدة");
    $(".overlay").removeClass("active");
    return;
  }

  const theCode = violationCategoryValue == "Quarry"
    ? { QuarryCode: $("#theCode").val() }
    : { CarNumber: $("#theCode").val() };

  let request = {
    Data: {
      ...theCode,
      RowsPerPage: 10,
      PageIndex: pagination.currentPage,
      ColName: "created",
      SortOrder: "desc",
      Status: "Pending",
      ViolatorName: $("#violatorName").val(),
      NationalID: $("#nationalID").val(),
      ViolationCode: $("#violationCode").val(),
      GlobalSearch: ViolationGeneralSearch,
      Sector: UserId,
      ViolationType: ViolationType,
      OffenderType: $("#violationCategory").val(),
      ViolationsZone: $("#violationZone").val(),
      CreatedFrom: $("#createdFrom").val()
        ? moment($("#createdFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
        : null,
      CreatedTo: $("#createdTo").val()
        ? moment($("#createdTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
        : null,
    },
  };
  $(".overlay").addClass("active");
  functions
    .requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search", {
      request,
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      $(".overlay").removeClass("active");
      let violationsData = [];
      let ItemsData = data.d.Result;
      if (data.d.Result?.GridData != null) {
        if (data.d.Result?.GridData.length > 0) {
          Array.from(data.d.Result?.GridData).forEach((element) => {
            violationsData.push(element);
          });
        } else {
          violationsData = [];
        }
      }
      registeredViolationsRecords.setPaginations(ItemsData.TotalPageCount, ItemsData.RowsPerPage);
      registeredViolationsRecords.dashBoardTable(violationsData, destroyTable);
      registeredViolationsRecords.pageIndex = ItemsData.CurrentPage;
    })
    .catch((err) => {
      $(".overlay").removeClass("active");
      console.log(err);
    });
};

registeredViolationsRecords.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", registeredViolationsRecords.getRegisteredViolations);
  pagination.activateCurrentPage();
};

registeredViolationsRecords.filterViolationsLog = (e) => {
  let pageIndex = registeredViolationsRecords.pageIndex;

  let ViolationTypeVal = $("#TypeofViolation")
    .children("option:selected")
    .data("id");
  let ViolationGeneralSearch = $("#violationSearch").val();
  const theCodeValue = $("#theCode").val();
  const violationCategoryValue = $("#violationCategory").val();

  // Check if theCode has value but violationCategory is empty
  if (theCodeValue && theCodeValue.trim() !== "" && (!violationCategoryValue || violationCategoryValue === "")) {
    functions.warningAlert("من فضلك قم باختيار تصنيف المخالفة قبل إدخال رقم المحجر/عربة/معدة");
    return;
  }

  let ViolationType;

  // Check if at least one search criteria is provided
  if (
    ViolationTypeVal == "0" &&
    ViolationGeneralSearch == "" &&
    $("#violatorName").val() == "" &&
    $("#nationalID").val() == "" &&
    $("#violationCode").val() == "" &&
    (violationCategoryValue == "" || violationCategoryValue == null) &&
    $("#violationZone").val() == "" &&
    $("#createdFrom").val() == "" &&
    $("#createdTo").val() == "" &&
    theCodeValue == ""
  ) {
    functions.warningAlert(
      "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
    );
  } else {
    $(".overlay").addClass("active");
    ViolationType = Number(
      $("#TypeofViolation").children("option:selected").data("id")
    );
    registeredViolationsRecords.getRegisteredViolations(
      pageIndex,
      true,
      ViolationType,
      ViolationGeneralSearch
    );
  }
};

registeredViolationsRecords.resetFilter = (e) => {
  e.preventDefault();
  $("#nationalID").val("");
  $("#violatorName").val("");
  $("#violationCode").val("");
  $("#violationCategory").val("");
  $("#TypeofViolation").val("0");
  $("#violationZone").val("");
  $("#violationSearch").val("");
  $("#createdFrom").val("");
  $("#createdTo").val("");
  $("#theCode").val("");

  $(".overlay").addClass("active");
  pagination.reset();
  registeredViolationsRecords.getRegisteredViolations();
};

registeredViolationsRecords.handleViolationCategoryChange = () => {
  $("#violationCategory").on("change", function () {
    const selectedCategory = $(this).val();
    const $theCodeField = $("#theCode");
    const $typeOfViolationField = $("#TypeofViolation");

    $theCodeField.prop("disabled", false);
    $typeOfViolationField.prop("disabled", false);

    if (selectedCategory === "Equipment") {
      $theCodeField.prop("disabled", true).val("");
      $typeOfViolationField.prop("disabled", true).val("0");
    } else if (selectedCategory === "Vehicle") {
      $typeOfViolationField.prop("disabled", true).val("0");
    }
  });
};

const originalResetFilter = registeredViolationsRecords.resetFilter;
registeredViolationsRecords.resetFilter = function (e) {
  originalResetFilter.call(this, e);
  $("#theCode").prop("disabled", false);
  $("#TypeofViolation").prop("disabled", false);
};

// ================= EXPORT FUNCTION =================
registeredViolationsRecords.exportToExcel = () => {
  // Get current filter values
  const theCodeValue = $("#theCode").val();
  const violationCategoryValue = $("#violationCategory").val();

  const theCode = {};
  if (theCodeValue && theCodeValue.trim() !== "" && violationCategoryValue) {
    if (violationCategoryValue === "Quarry") {
      theCode.QuarryCode = theCodeValue;
    } else if (violationCategoryValue === "Vehicle") {
      theCode.CarNumber = theCodeValue;
    }
  }

  const currentFilters = {
    ...theCode,
    RowsPerPage: 10000000, // Get all records for export
    PageIndex: 1,
    ColName: "created",
    SortOrder: "desc",
    Status: "Pending",
    ViolatorName: $("#violatorName").val(),
    NationalID: $("#nationalID").val(),
    ViolationCode: $("#violationCode").val(),
    ViolationType: Number($("#TypeofViolation").children("option:selected").data("id")),
    GlobalSearch: $("#violationSearch").val(),
    Sector: _spPageContextInfo.userId,
    OffenderType: $("#violationCategory").val(),
    ViolationsZone: $("#violationZone").val(),
    CreatedFrom: $("#createdFrom").val() ? moment($("#createdFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD") : null,
    CreatedTo: $("#createdTo").val() ? moment($("#createdTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD") : null,
  };

  // Define columns with their data mapping
  const columns = [
    {
      title: "رقم المخالفة",
      data: "Violation.ViolationCode",
    },
    {
      title: "",
      skip: true
    },
    {
      title: "تصنيف المخالفة",
      render: (record) => functions.getViolationArabicName(record.Violation?.OffenderType),
    },
    {
      title: "نوع المخالفة",
      render: (record) => functions.getViolationArabicName(record.Violation?.OffenderType, record.Violation?.ViolationTypes?.Title),
    },
    {
      title: "تاريخ الضبط",
      render: (record) => functions.getFormatedDate(record.Violation?.ViolationDate),
    },
    {
      title: "إسم الشركة المخالفة",
      data: "Violation.ViolatorCompany",
    },
    {
      title: "رقم المحجر/العربة",
      render: (record) => {
        const violation = record.Violation;
        if (!violation) return "---";
        return violation.OffenderType === "Vehicle" ? (violation.CarNumber || "---") : (violation.QuarryCode || "---");
      },
    },
    {
      title: "المنطقة",
      data: "Violation.ViolationsZone",
    },
  ];

  functions.exportFromAPI({
    searchUrl: "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search",
    requestData: { Data: currentFilters },
    columns: columns,
    fileName: "سجل المحاضر المسجلة.xlsx",
    sheetName: "سجل المحاضر المسجلة",
    columnWidths: 25,
    rtl: true,
    dataPath: "d.Result.GridData",
    exportButtonSelector: "#exportBtn",
    tableSelector: "#RegisteredViolationsTable"
  });
};

registeredViolationsRecords.dashBoardTable = (violationsData, destroyTable) => {
  let data = [];
  let taskViolation;

  if (registeredViolationsRecords.destroyTable || destroyTable) {
    $("#RegisteredViolationsTable").DataTable().destroy();
  }

  if (violationsData.length > 0) {
    violationsData.forEach((record) => {
      taskViolation = record.Violation;
      data.push([
        `<div class="violationId" data-violationid="${record.ViolationId}" data-taskid="${record.ID}" data-offendertype="${taskViolation.OffenderType}">${taskViolation.ViolationCode}</div>`,
        `<div class='controls'>
              <div class='ellipsisButton'>
                  <i class='fa-solid fa-ellipsis-vertical'></i>
              </div>
              <div class="hiddenListBox">
                  <div class='arrow'></div>
                  <ul class='list-unstyled controlsList'>
                      <li><a href="#" class="itemDetails"> المزيد من التفاصيل</a></li>     
                      <li><a href="#" data-violationid="${taskViolation?.ID}" data-violationcode="${taskViolation?.ViolationCode}" class="violationHistory" data-toggle="modal" data-target="#trackHistoryModal">تتبع مرحلة المخالفة</a></li>
                  </ul>
              </div>
          </div>`,
        `<div class="violationArName">${functions.getViolationArabicName(
          taskViolation.OffenderType
        )}</div>`,
        `<div class="violationType" data-typeid="${taskViolation.OffenderType == "Quarry"
          ? taskViolation.ViolationTypes.ID
          : 0
        }">${functions.getViolationArabicName(
          taskViolation.OffenderType,
          taskViolation?.ViolationTypes?.Title
        )}</div>`,
        `${functions.getFormatedDate(taskViolation.ViolationDate)}`,
        `<div class="companyName">${taskViolation.ViolatorCompany != ""
          ? taskViolation.ViolatorCompany
          : "-"
        }</div>`,
        `<div class="violationCode">${taskViolation.OffenderType == "Vehicle"
          ? taskViolation.CarNumber
          : taskViolation.QuarryCode != ""
            ? taskViolation.QuarryCode
            : "---"
        }</div>`,
        `<div class="violationZone">${taskViolation.ViolationsZone}</div>`,
        `<div class="violationAttachments" data-violationid="${taskViolation?.ID}" data-violationcode="${taskViolation?.ViolationCode}"><a href="#!" style="color: black;">المرفقات</a></div>`,
      ]);
    });
  }

  let Table = functions.tableDeclare(
    "#RegisteredViolationsTable",
    data,
    [
      { title: "رقم المخالفة", class: "no-sort" },
      { title: "", class: "all no-sort" },
      { title: "تصنيف المخالفة", class: "no-sort" },
      { title: "نوع المخالفة ", class: "no-sort" },
      { title: "تاريخ الضبط", class: "sort" },
      { title: "إسم الشركة المخالفة", class: "no-sort" },
      { title: " رقم المحجر/العربة", class: "no-sort" },
      { title: "المنطقة", class: "no-sort" },
      { title: "المرفقات", class: "no-sort" },
    ],
    false,
    false,
    "سجل المحاضر المسجلة.xlsx",
    "سجل المحاضر المسجلة"
  );

  functions.createColumnSelector(Table, "#columnSelector", 'blue');
  registeredViolationsRecords.destroyTable = true;

  // Update export button handler
  $("#exportBtn").off("click").on("click", () => {
    registeredViolationsRecords.exportToExcel();
  });

  // $(".ellipsisButton").on("click", (e) => {
  //   $(".hiddenListBox").hide(300);
  //   $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
  // });

  let violationlog = Table.rows().nodes().to$();
  $.each(violationlog, (index, record) => {
    let jQueryRecord = $(record);
    let violationID = jQueryRecord.find(".violationId").data("violationid");
    let taskID = jQueryRecord.find(".violationId").data("taskid");
    let OffenderType = jQueryRecord.find(".violationId").data("offendertype");
    let violationCode = jQueryRecord.find(".violationId").text().trim(); // Get violation code

    // Toggle menu
    jQueryRecord.find(".controls").children(".ellipsisButton").on("click", (e) => {
      e.stopPropagation();
      const currentBox = $(e.currentTarget).siblings(".hiddenListBox");
      $(".hiddenListBox").not(currentBox).stop(true, true).hide(300);
      currentBox.stop(true, true).toggle(300);
    });

    jQueryRecord.find(".violationAttachments").find("a").off('click').on('click', function (e) {
      e.preventDefault();
      $(".overlay").addClass("active");
      registeredViolationsRecords.getViolationAttachmentsById(violationID, violationCode);
    });

    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".itemDetails")
      .on("click", (e) => {
        $(".overlay").addClass("active");
        registeredViolationsRecords.findViolationByID(e, taskID);
      });
    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".printViolationDetails")
      .on("click", (e) => {
        $(".overlay").addClass("active");
        registeredViolationsRecords.findViolationByID(e, taskID, true);
      });
  });
  functions.hideTargetElement(".controls", ".hiddenListBox");
};

registeredViolationsRecords.findViolationByID = (event, taskID, print = false) => {
  let request = {
    Id: taskID,
  };
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/FindbyId",
      request
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      let violationData;
      let violationOffenderType;
      let Content;
      let printBox;
      if (data != null) {
        violationData = data.d.Violation;
        violationOffenderType = violationData.OffenderType;
        if (violationOffenderType == "Quarry") {
          Content = DetailsPopup.quarryDetailsPopupContent(
            violationData,
            "المسجلة"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup", "blueHeaderPopup"],
            printBox
          );
        } else if (violationOffenderType == "Vehicle") {
          Content = DetailsPopup.vehicleDetailsPopupContent(
            violationData,
            "المسجلة"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup", "blueHeaderPopup"],
            printBox
          );
          let vehicleType = violationData.VehicleType;
          $(".TrailerNumberBox").addClass("hello");
          if (vehicleType == "عربة بمقطورة") {
            $(".TrailerNumberBox").addClass("hello");
            $(".TrailerNumberBox")
              .show()
              .css("background-color", "red !important");
          } else {
            $(".TrailerNumberBox").hide();
            $(".TrailerNumberBox").addClass("hello");
          }
        } else if (violationOffenderType == "Equipment") {
          Content = DetailsPopup.equipmentDetailsPopupContent(
            violationData,
            "المسجلة"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup", "blueHeaderPopup"],
            printBox
          );
        }

        // FIX: Hide buttons AFTER rendering
        setTimeout(() => {
          const popup = $(".detailsPopupForm");
          popup.find("#editMaterialMinPrice, #payAllPrice")
            .css("display", "none")
            .attr("style", "display: none !important");
        }, 50);

        $(".printBtn").on("click", (e) => {
          functions.PrintDetails(e);
        });
        if (print) {
          functions.PrintDetails(event);
        }

        $(".detailsPopupForm").addClass("registredViolationsLog");
        $(".registredViolationsLog")
          .find(".CommiteeMembersBox")
          .show()
          .find(".formElements")
          .css("border-bottom", "none");
      } else {
        violationData = null;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

// ========== attachment popup =========
registeredViolationsRecords.getViolationAttachmentsById = (violationId, violationCode) => {
  let request = {
    id: violationId,
    listName: "Violations",
  };

  $.ajax({
    type: "POST",
    url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Get",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    data: JSON.stringify(request),
    success: (data) => {
      $(".overlay").removeClass("active");

      if (data && data.d && Array.isArray(data.d) && data.d.length > 0) {
        let attachmentsData = data.d;

        // Create structure similar to what the popup expects
        let attachmentRecords = [{
          Attachments: attachmentsData.map(att => ({
            Url: att.Url,
            Name: att.Name
          })),
          UploadPhase: "مرفقات المخالفة",
          Created: new Date().toISOString(),
          Comments: ""
        }];

        registeredViolationsRecords.violationAttachmentsDetailsPopup(
          violationId,
          violationCode,
          attachmentRecords
        );
      } else {
        // No attachments found
        registeredViolationsRecords.violationAttachmentsDetailsPopup(
          violationId,
          violationCode,
          []
        );
      }
    },
    error: (xhr) => {
      console.error("Error fetching violation attachments:", xhr);
      $(".overlay").removeClass("active");
      functions.warningAlert("حدث خطأ في تحميل المرفقات");
    },
  });
};

registeredViolationsRecords.violationAttachmentsDetailsPopup = (
  violationId,
  violationCode,
  violationAttachmentsRecords
) => {
  let popupHtml = `
    <div class="popupHeader attachPopup" style="display: flex; justify-content: space-between;">
        <div class="violationsCode"> 
            <p>مرفقات المخالفة رقم (${violationCode || "-----"})</p>
        </div>
        <div class="btnStyle cancelBtn popupBtn closeViolationAttachPopup" id="closeViolationAttachPopup" style="color: #fff;cursor: pointer;" data-dismiss="modal" aria-label="Close">
            <i class="fa-solid fa-x"></i>
        </div>
    </div> 
    <div class="popupBody">
        <div class="popupTableBox">
            <table id="violationAttachmentsTable" class="table tableWithIcons popupTable"></table>
        </div>
        <div class="formButtonsBox">
            <div class="row">
                <div class="col-12">
                    <div class="buttonsBox centerButtonsBox">
                        <div class="btnStyle cancelBtn popupBtn closeViolationAttachPopupFooter" id="closeViolationAttachPopupFooter" data-dismiss="modal" aria-label="Close">إغلاق</div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

  functions.declarePopup(
    ["generalPopupStyle", "bluePopup", "editPopup", "attachPopup"],
    popupHtml
  );

  registeredViolationsRecords.drawViolationAttachmentsPopupTable(
    "#violationAttachmentsTable",
    violationAttachmentsRecords
  );

  // Add close button handlers
  $("#closeViolationAttachPopup, #closeViolationAttachPopupFooter").on("click", function () {
    functions.closePopup();
  });
};

registeredViolationsRecords.drawViolationAttachmentsPopupTable = (
  TableId,
  violationAttachmentsRecords
) => {
  $(".overlay").removeClass("active");
  let data = [];
  let counter = 1;

  if (violationAttachmentsRecords.length > 0) {
    violationAttachmentsRecords.forEach((attchRecord) => {
      let attachedFilesData = attchRecord.Attachments || [];
      data.push([
        `<div class="attachCount">${counter}</div>`,
        `<div class="attachFiles" data-fileslength="${attachedFilesData.length}">
            ${registeredViolationsRecords.drawAttachmentsInTable(attachedFilesData)}
        </div>`,
        `<div class="attachUploadPhase">${attchRecord.UploadPhase || "----"}</div>`,
        `<div class="attachUploadDate">${functions.getFormatedDate(
          attchRecord.Created,
          "DD-MM-YYYY hh:mm A"
        )}</div>`,
        `<div class="attachComments">${attchRecord.Comments != ""
          ? attchRecord.Comments
          : "----"
        }</div>`,
      ]);
      counter++;
    });
  } else {
    data.push([
      `<div class="no-data">لا توجد مرفقات</div>`,
      "",
      "",
      "",
      ""
    ]);
  }

  let Table = $(TableId).DataTable({
    destroy: true,
    paging: false,
    searching: false,
    ordering: false,
    info: false,
    responsive: true,
    autoWidth: false,
    scrollX: false,
    data: data,

    columns: [
      { title: "م" },
      { title: "المرفقات" },
      { title: "سبب الإرفاق" },
      { title: "تاريخ الإرفاق" },
      { title: "ملاحظات" }
    ],

    language: {
      emptyTable: "لا توجد بيانات"
    }
  });

  let attachmentsLog = Table.rows().nodes().to$();
  $.each(attachmentsLog, (index, record) => {
    let jQueryRecord = $(record);
    let attachFiles = jQueryRecord.find(".attachFiles");
    let attachFilesLength = jQueryRecord.find(".attachFiles").data("fileslength");

    if (attachFilesLength == 1) {
      attachFiles.find(".attchedFile").addClass("singleFile");
    }
    if (attachFilesLength == 2) {
      attachFiles.find(".attchedFile").addClass("multibleFiles");
    }
    if (attachFilesLength >= 3) {
      attachFiles.find(".attchedFile").addClass("manyFiles");
    }
  });
};

registeredViolationsRecords.drawAttachmentsInTable = (Attachments) => {
  let attachmentsBox = ``;

  if (Attachments && Attachments.length > 0) {
    Attachments.forEach((attachment) => {
      attachmentsBox += `
        <a class="attchedFile" target="_blank" href="${attachment.Url}" download="${attachment.Name}" title="${attachment.Name}">
            <div class="attachDetailsBox">
                <p class="attchedFileName">${attachment.Name}</p>
            </div>
            <span><i class="fa-solid fa-download"></i></span>
        </a>
      `;
    });
  } else {
    attachmentsBox = `<p class="noAttachedFiles">لا يوجد مرفقات</p>`;
  }
  return attachmentsBox;
};
////////////////////////////////////////////

const ViolationHistoryLogs = () => {
  let selectedViolationId = null;
  let selectedViolationCode = null;
  let trackHistoryTable = null;

  $(".contentContainer").on("click", ".violationHistory", function (e) {
    e.preventDefault();
    e.stopPropagation();
    selectedViolationId = $(this).data("violationid");
    selectedViolationCode = $(this).data("violationcode");
    $("#trackHistoryModal").modal("show");
  });

  const closeModal = () => {
    $("#trackHistoryModal").modal("hide");
    $(".track-history-violation-code").text("");
    if (trackHistoryTable) {
      trackHistoryTable.clear().destroy();
      trackHistoryTable = null;
    }
    $("#trackHistoryTable tbody").empty();
  };

  $(document).on("click", "#closeViolationHistoryPopup", function (e) {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });

  $("#trackHistoryModal").on("hidden.bs.modal", function () {
    closeModal();
  });

  $(".track-history-modal").on("shown.bs.modal", function () {
    $(".track-history-violation-code").text(selectedViolationCode);

    const request = {
      Request: {
        ViolationId: selectedViolationId,
      },
    };

    const tableElement = $("#trackHistoryTable");

    if (!trackHistoryTable) {
      trackHistoryTable = tableElement.DataTable({
        processing: true,
        paging: false,
        responsive: true,
        destroy: true,
        ajax: {
          url: "/_layouts/15/Uranium.Violations.SharePoint/ViolationHistoryLogs.aspx/Search",
          type: "POST",
          contentType: "application/json",
          data: () => JSON.stringify(request),
          dataSrc: (data) => {
            return data?.d?.Result?.GridData || [];
          }
        },
        columns: [
          {
            data: null,
            render: (data, type, row, meta) => {
              return meta.row;
            }
          },
          {
            data: "Status",
            render: (data) => {
              return data || "-";
            }
          },
          {
            data: "Created",
            render: (data) =>
              data ? functions.getFormatedDate(data) : "-"
          },
          {
            data: "CreatedBy",
            render: (data) => {
              return data || "-";
            }
          },
          {
            data: "Comment",
            render: (data) => {
              return data || "-";
            }
          }
        ],
        language: {
          emptyTable: "لا توجد بيانات",
        }
      });
    } else {
      trackHistoryTable.ajax.reload();
    }
  });

  $(".track-history-modal").on("hidden.bs.modal", function () {
    $(".track-history-violation-code").text("");
    if (trackHistoryTable) {
      trackHistoryTable.clear().destroy();
      trackHistoryTable = null;
    }
    $("#trackHistoryTable tbody").empty();
  });
};

ViolationHistoryLogs();

export default registeredViolationsRecords;