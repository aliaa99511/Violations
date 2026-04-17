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
    $(".PreLoader").removeClass("active");
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
      $(".PreLoader").removeClass("active");
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
    $(".PreLoader").addClass("active");
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

  $(".PreLoader").addClass("active");
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
      title: "رقم المحجر/العربة",
      render: (record) => {
        const violation = record.Violation;
        if (!violation) return "---";
        return violation.OffenderType === "Vehicle" ? (violation.CarNumber || "---") : (violation.QuarryCode || "---");
      },
    },
    {
      title: "إسم الشركة المخالفة",
      data: "Violation.ViolatorCompany",
    },
    {
      title: "نوع المخالفة",
      render: (record) => functions.getViolationArabicName(record.Violation?.OffenderType, record.Violation?.ViolationTypes?.Title),
    },
    {
      title: "المنطقة",
      data: "Violation.ViolationsZone",
    },
    {
      title: "تاريخ الضبط",
      render: (record) => functions.getFormatedDate(record.Violation?.ViolationDate),
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
        `<div class="violationCode">${taskViolation.OffenderType == "Vehicle"
          ? taskViolation.CarNumber
          : taskViolation.QuarryCode != ""
            ? taskViolation.QuarryCode
            : "---"
        }</div>`,
        `<div class="companyName">${taskViolation.ViolatorCompany != ""
          ? taskViolation.ViolatorCompany
          : "-"
        }</div>`,
        `<div class="violationType" data-typeid="${taskViolation.OffenderType == "Quarry"
          ? taskViolation.ViolationTypes.ID
          : 0
        }">${functions.getViolationArabicName(
          taskViolation.OffenderType,
          taskViolation?.ViolationTypes?.Title
        )}</div>`,
        `<div class="violationZone">${taskViolation.ViolationsZone}</div>`,
        `${functions.getFormatedDate(taskViolation.ViolationDate)}`,
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
      { title: " رقم المحجر/العربة", class: "no-sort" },
      { title: "إسم الشركة المخالفة", class: "no-sort" },
      { title: "نوع المخالفة ", class: "no-sort" },
      { title: "المنطقة", class: "no-sort" },
      { title: "تاريخ الضبط", class: "sort" },
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

  $(".ellipsisButton").on("click", (e) => {
    $(".hiddenListBox").hide(300);
    $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
  });

  let violationlog = Table.rows().nodes().to$();
  $.each(violationlog, (index, record) => {
    let jQueryRecord = $(record);
    let violationID = jQueryRecord.find(".violationId").data("violationid");
    let taskID = jQueryRecord.find(".violationId").data("taskid");
    let OffenderType = jQueryRecord.find(".violationId").data("offendertype");

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