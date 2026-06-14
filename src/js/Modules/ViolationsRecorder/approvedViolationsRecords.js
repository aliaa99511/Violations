import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import pagination from "../../Shared/Pagination";

let approvedViolationsRecords = {};
// approvedViolationsRecords.pageIndex = 1;
approvedViolationsRecords.dataObj = {
  destroyTable: false,
  OffenderType: "",
  ViolationType: 0,
}

approvedViolationsRecords.getApprovedViolations = () => {
  let UserId = _spPageContextInfo.userId;
  let request = {
    Data: {
      RowsPerPage: 10,
      PageIndex: pagination.currentPage,
      ColName: "created",
      SortOrder: "desc",
      Status: "Approved",
      Sector: UserId,
      ViolationType: approvedViolationsRecords.dataObj.ViolationType,
      OffenderType: approvedViolationsRecords.dataObj.OffenderType,
    },
  };
  $(".overlay").addClass("active");
  functions.requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search", { request })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      $(".overlay").removeClass("active");
      let violationsData = [];
      let ItemsData = data.d.Result;
      if (data.d.Result.GridData != null) {
        if (data.d.Result.GridData.length > 0) {
          Array.from(data.d.Result.GridData).forEach((element) => {
            violationsData.push(element);
          });
        } else {
          violationsData = [];
        }
      }
      approvedViolationsRecords.setPaginations(ItemsData.TotalPageCount, ItemsData.RowsPerPage);
      approvedViolationsRecords.dashBoardTable(violationsData);
      approvedViolationsRecords.dataObj.destroyTable = true;
      // approvedViolationsRecords.pageIndex = ItemsData.CurrentPage;
    })
    .catch((err) => {
      $(".overlay").removeClass("active");
      console.log(err);
    });
};
approvedViolationsRecords.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", approvedViolationsRecords.getApprovedViolations);
  // pagination.reset()
  // pagination.scrollToElement(el, length)
  pagination.activateCurrentPage();
};
approvedViolationsRecords.handleViolationCategoryChange = () => {
  $("#violationCategory").on("change", function () {
    const selectedCategory = $(this).val();
    const $typeOfViolationField = $("#TypeofViolation");

    // First, enable both fields
    $typeOfViolationField.prop("disabled", false);

    // Handle "Equipment" selection
    if (selectedCategory === "Equipment") {
      $typeOfViolationField.prop("disabled", true).val("0"); // Disable and set to default
    }

    // Handle "Vehicle" selection
    else if (selectedCategory === "Vehicle") {
      $typeOfViolationField.prop("disabled", true).val("0"); // Disable and set to default
    }
  });
};
const originalResetFilter = approvedViolationsRecords.resetFilter;
approvedViolationsRecords.resetFilter = function (e) {
  // Call the original resetFilter function
  originalResetFilter.call(this, e);

  // Re-enable both fields after reset
  $("#TypeofViolation").prop("disabled", false);
};

approvedViolationsRecords.dashBoardTable = (violationsData) => {
  let data = [];
  let taskViolation;
  // let violationData;
  if (violationsData.length > 0) {
    violationsData.forEach(record => {
      taskViolation = record.Violation;
      let createdDate = functions.getFormatedDate(record.Created);
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
                        <li>
                          <a href="#"
                            data-violationid="${taskViolation?.ID}"
                            data-violationcode="${taskViolation?.ViolationCode}"
                            class="violationHistory"
                            data-toggle="modal"
                            data-target="#trackHistoryModal">
                            تتبع مرحلة المخالفة
                          </a>
                        </li>                    
                    </ul>
                </div>
            </div>`,
        `<div class="violationArName">${functions.getViolationArabicName(taskViolation.OffenderType)}</div>`,
        `<div class="violationCode">${taskViolation.OffenderType == "Vehicle" ? taskViolation.CarNumber : taskViolation.QuarryCode != "" ? taskViolation.QuarryCode : "---"}</div>`,
        `<div class="companyName">${taskViolation.ViolatorCompany != "" ? taskViolation.ViolatorCompany : "-"}</div>`,
        `<div class="violationType" data-typeid="${taskViolation.OffenderType == "Quarry" ? taskViolation.ViolationTypes.ID : 0}">${functions.getViolationArabicName(taskViolation.OffenderType, taskViolation?.ViolationTypes?.Title)}</div>`,
        `<div class="violationZone">${taskViolation.ViolationsZone}</div>`,
        `${functions.getFormatedDate(taskViolation.ViolationDate)}`,
        `${createdDate}`,


      ]);
    });
  }
  let Table = functions.tableDeclare(
    "#approvedViolationsRecordsTable",
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
      { title: "تاريخ الإنشاء", class: "sort" },
    ],
    false,
    approvedViolationsRecords.dataObj.destroyTable,
    "سجل المحاضر الموافق عليها.xlsx",
    "سجل المحاضر الموافق عليها"
  );

  // 🔹 create column selector
  functions.createColumnSelector(Table, "#columnSelector", 'blue');

  // Update export button handler
  $("#exportBtn").off("click").on("click", () => {
    approvedViolationsRecords.exportToExcel();
  });

  // $(".ellipsisButton").on("click", (e) => {
  //   $(".hiddenListBox").hide(300);
  //   $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
  // });

  let violationlog = Table.rows().nodes().to$();
  $.each(violationlog, (index, record) => {
    let jQueryRecord = $(record);
    let taskID = jQueryRecord.find(".violationId").data("taskid");

    // Toggle menu
    jQueryRecord.find(".controls").children(".ellipsisButton").on("click", (e) => {
      e.stopPropagation();
      const currentBox = $(e.currentTarget).siblings(".hiddenListBox");
      $(".hiddenListBox").not(currentBox).stop(true, true).hide(300);
      currentBox.stop(true, true).toggle(300);
    });

    jQueryRecord.find(".controls").children(".hiddenListBox").find(".itemDetails").on("click", (e) => {
      $(".overlay").addClass("active");
      approvedViolationsRecords.findViolationByID(e, taskID);
    });
    jQueryRecord.find(".controls").children(".hiddenListBox").find(".printViolationDetails").on("click", (e) => {
      $(".overlay").addClass("active");
      approvedViolationsRecords.findViolationByID(e, taskID, true);
    });
  });
  functions.hideTargetElement(".controls", ".hiddenListBox");
};
approvedViolationsRecords.exportToExcel = () => {
  // Get current filter values
  const currentFilters = {
    RowsPerPage: 10000000, // Get all records for export
    PageIndex: 1,
    ColName: "created",
    SortOrder: "desc",
    Status: "Approved",
    Sector: _spPageContextInfo.userId,
    ViolationType: approvedViolationsRecords.dataObj.ViolationType,
    OffenderType: approvedViolationsRecords.dataObj.OffenderType,
    ViolatorName: $("#violatorName").val(),
    NationalID: $("#nationalID").val(),
    ViolationCode: $("#violationCode").val(),
    GlobalSearch: $("#violationSearch").val(),
    ViolationsZone: $("#violationZone").val(),
    SectorConfigId: Number($("#violationSector").children("option:selected").val()),
    CreatedFrom: $("#createdFrom").val() ? moment($("#createdFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD") : null,
    CreatedTo: $("#createdTo").val() ? moment($("#createdTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD") : null,
  };

  // Add theCode field if applicable
  const theCodeValue = $("#theCode").val();
  const violationCategoryValue = $("#violationCategory").val();

  if (theCodeValue && theCodeValue.trim() !== "" && violationCategoryValue) {
    if (violationCategoryValue === "Quarry") {
      currentFilters.QuarryCode = theCodeValue;
    } else if (violationCategoryValue === "Vehicle") {
      currentFilters.CarNumber = theCodeValue;
    }
  }

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
    {
      title: "تاريخ الإنشاء",
      render: (record) => functions.getFormatedDate(record.Created),
    },
  ];

  functions.exportFromAPI({
    searchUrl: "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search",
    requestData: { Data: currentFilters },
    columns: columns,
    fileName: "سجل المحاضر الموافق عليها.xlsx",
    sheetName: "سجل المحاضر الموافق عليها",
    columnWidths: 25,
    rtl: true,
    dataPath: "d.Result.GridData",
    exportButtonSelector: "#exportBtn",
    tableSelector: "#approvedViolationsRecordsTable"
  });
};
approvedViolationsRecords.findViolationByID = (event, taskID, print = false) => {
  let request = {
    Id: taskID,
  };
  functions.requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/FindbyId", request)
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
          Content = DetailsPopup.quarryDetailsPopupContent(violationData, "الموافق عليها");
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(["generalPopupStyle", "detailsPopup", "blueHeaderPopup"], printBox);
        } else if (violationOffenderType == "Vehicle") {
          Content = DetailsPopup.vehicleDetailsPopupContent(violationData, "الموافق عليها");
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(["generalPopupStyle", "detailsPopup", "blueHeaderPopup"], printBox);
          let vehicleType = violationData.VehicleType;
          if (vehicleType == "عربة بمقطورة") {
            $(".TrailerNumberBox").show();
          } else {
            $(".TrailerNumberBox").hide();
          }
        } else if (violationOffenderType == "Equipment") {
          Content = DetailsPopup.equipmentDetailsPopupContent(violationData, "الموافق عليها");
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(["generalPopupStyle", "detailsPopup", "blueHeaderPopup"], printBox);
        }
        $(".detailsPopupForm").addClass("approvedViolationsRecordsLog")
        // $(".approvedViolationsRecordsLog").find(".CommiteeMembersBox").show().find(".formElements").css("border-bottom","none")

        $(".printBtn").on("click", (e) => {
          functions.PrintDetails(e)
        })

        if (print) {
          functions.PrintDetails(event)
        }
      } else {
        violationData = null;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};
approvedViolationsRecords.filterViolationsLog = (e) => {
  // let pageIndex = approvedViolationsRecords.pageIndex;
  let OffenderTypeVal = $("#violationCategory").children("option:selected").val();
  let ViolationTypeVal = $("#TypeofViolation").children("option:selected").data("id");
  // let ViolationType;
  // let offenderType;

  if (ViolationTypeVal == "" && OffenderTypeVal == "") {
    functions.warningAlert(
      "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
    );
  } else if (OffenderTypeVal != "" || ViolationTypeVal != "0") {
    $(".overlay").addClass("active");
    approvedViolationsRecords.dataObj.OffenderType = $("#violationCategory").children("option:selected").val();
    approvedViolationsRecords.dataObj.ViolationType = Number($("#TypeofViolation").children("option:selected").data("id"));
    approvedViolationsRecords.dataObj.destroyTable = true;
    approvedViolationsRecords.dataObj.pageIndex = pagination.currentPage
    approvedViolationsRecords.getApprovedViolations();
  }
};
approvedViolationsRecords.resetFilter = (e) => {
  e.preventDefault();
  $("#violationCategory").val(""); // Reset to "الكل" (the disabled selected hidden option)
  $("#TypeofViolation").val("0"); // Reset to "الكل" with data-id="0"

  // Reset the data object properties
  approvedViolationsRecords.dataObj.OffenderType = "";
  approvedViolationsRecords.dataObj.ViolationType = 0;
  approvedViolationsRecords.dataObj.destroyTable = true;

  pagination.reset();
  $(".overlay").addClass("active");
  approvedViolationsRecords.getApprovedViolations();
};


// ========== Tracking History Functions =========
const ViolationHistoryLogs = () => {
  let selectedViolationId = null;
  let selectedViolationCode = null;
  let trackHistoryTable = null;

  // ===============================
  //  فتح المودال
  // ===============================
  $(".contentContainer").on("click", ".violationHistory", function (e) {
    e.preventDefault();
    e.stopPropagation();

    selectedViolationId = $(this).data("violationid");
    selectedViolationCode = $(this).data("violationcode");

    $("#trackHistoryModal").modal("show");
  });

  // ===============================
  //  إغلاق المودال - Close button handlers
  // ===============================
  const closeModal = () => {
    $("#trackHistoryModal").modal("hide");

    // Clear the modal content
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

  // // Close button in footer
  // $(document).on("click", "#closeViolationHistoryPopupFooter", function (e) {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   closeModal();
  // });

  // Bootstrap modal hide event
  $("#trackHistoryModal").on("hidden.bs.modal", function () {
    closeModal();
  });

  // ===============================
  //  لما المودال يفتح
  // ===============================
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
          { data: null, render: (data, type, row, meta) => meta.row },
          { data: "Status", render: (data) => data || "-" },
          { data: "Created", render: (data) => data ? functions.getFormatedDate(data) : "-" },
          { data: "CreatedBy", render: (data) => data || "-" },
          { data: "Comment", render: (data) => data || "-" }
        ],
        language: { emptyTable: "لا توجد بيانات" }
      });
    } else {
      trackHistoryTable.ajax.reload();
    }
  });

  // ===============================
  //  لما المودال يقفل
  // ===============================
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

export default approvedViolationsRecords;
