import Swal from "sweetalert2";
import DetailsPopup from "../../Shared/detailsPopupContent";
import functions from "../../Shared/functions";
import { ajaxDatatableHistoryInit } from "../../Shared/ajaxDatatable";
import sharedApis from "../../Shared/sharedApiCall";
import pagination from "../../Shared/Pagination";

import { event } from "jquery";

let confirmedViolationLog = {};

confirmedViolationLog.pageIndex = 1;
confirmedViolationLog.destroyTable = false;

confirmedViolationLog.getConfirmedLog = (
  pageIndex = 1,
  destroyTable = false,
  ViolationSector = Number($("#violationSector").children("option:selected").val()),
  ViolationType = Number($("#TypeofViolation").children("option:selected").data("id")),
  ViolationGeneralSearch = $("#violationSearch").val()
) => {
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

  // Get selected status
  const selectedStatus = $("#ViolationStatus").children("option:selected").val();

  // Determine MultipleStatus based on selected status
  let multipleStatus = [];

  if (selectedStatus && selectedStatus !== "") {
    // If a specific status is selected, only use that status
    multipleStatus = [selectedStatus];
  } else {
    // If no status selected, use default list (excluding any you don't want)
    multipleStatus = [
      "Confirmed",
      "Paid",
      "Exceeded",
      "Paid After Reffered",
      "Saved",
      "Cancelled"
      // "UnderPayment",
    ];
  }

  let request = {
    Data: {
      ...theCode,
      RowsPerPage: 10,
      PageIndex: pagination.currentPage,
      ColName: "created",
      SortOrder: "desc",
      Status: selectedStatus, // Keep this for reference
      MultipleStatus: multipleStatus, // Use dynamic multipleStatus
      ViolatorName: $("#violatorName").val(),
      NationalID: $("#nationalID").val(),
      ViolationCode: $("#violationCode").val(),
      ViolationType: ViolationType,
      SectorConfigId: ViolationSector,
      GlobalSearch: ViolationGeneralSearch,
      Sector: 0,
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
    .requester("_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search", {
      request,
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      $(".PreLoader").removeClass("active");
      let ConfirmedViolation = [];
      let ItemsData = data.d.Result;
      if (data.d.Result.GridData != null) {
        if (data.d.Result.GridData.length > 0) {
          Array.from(data.d.Result.GridData).forEach((element) => {
            ConfirmedViolation.push(element);
          });
        } else {
          ConfirmedViolation = [];
        }
      }
      confirmedViolationLog.setPaginations(ItemsData.TotalPageCount, ItemsData.RowsPerPage);
      confirmedViolationLog.ConfirmedViolationTable(ConfirmedViolation, confirmedViolationLog.destroyTable);
      confirmedViolationLog.pageIndex = ItemsData.CurrentPage;
    })
    .catch((err) => {
      console.log(err);
    });
};

confirmedViolationLog.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", confirmedViolationLog.getConfirmedLog);
  pagination.activateCurrentPage();
};

confirmedViolationLog.filterConfirmedLog = (e) => {
  let pageIndex = confirmedViolationLog.pageIndex;
  let ViolationSectorVal = $("#violationSector").children("option:selected").val();
  let ViolationTypeVal = $("#TypeofViolation").children("option:selected").data("id");
  let ViolationGeneralSearch = $("#violationSearch").val();

  // Check if theCode has value but violationCategory is empty
  const theCodeValue = $("#theCode").val();
  const violationCategoryValue = $("#violationCategory").val();

  if (theCodeValue && theCodeValue.trim() !== "" && (!violationCategoryValue || violationCategoryValue === "")) {
    functions.warningAlert("من فضلك قم باختيار تصنيف المخالفة قبل إدخال رقم المحجر/عربة/معدة");
    return;
  }

  let ViolationType;
  let ViolationSector;

  if (
    ViolationTypeVal == "" &&
    ViolationSectorVal == "" &&
    ViolationGeneralSearch == ""
  ) {
    functions.warningAlert(
      "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
    );
  } else if (
    ViolationSectorVal != "" ||
    ViolationTypeVal != "0" ||
    ViolationGeneralSearch != ""
  ) {
    $(".PreLoader").addClass("active");
    ViolationSector = Number($("#violationSector").children("option:selected").val());
    ViolationType = Number($("#TypeofViolation").children("option:selected").data("id"));

    confirmedViolationLog.getConfirmedLog(
      pageIndex,
      true,
      ViolationSector,
      ViolationType,
      ViolationGeneralSearch
    );
  }
};

confirmedViolationLog.resetFilter = (e) => {
  e.preventDefault();
  $("#nationalID").val("");
  $("#violatorName").val("");
  $("#violationCode").val("");
  $("#violationSector").val("0");
  $("#violationCategory").val("");
  $("#TypeofViolation").val("0");
  $("#violationZone").val("");
  $("#violationSearch").val("");
  $("#createdFrom").val("");
  $("#createdTo").val("");
  $("#theCode").val("");
  $("#ViolationStatus").val("");

  $(".PreLoader").addClass("active");
  pagination.reset();
  confirmedViolationLog.getConfirmedLog();
};

confirmedViolationLog.handleViolationCategoryChange = () => {
  $("#violationCategory").on("change", function () {
    const selectedCategory = $(this).val();
    const $theCodeField = $("#theCode");
    const $typeOfViolationField = $("#TypeofViolation");

    // First, enable both fields
    $theCodeField.prop("disabled", false);
    $typeOfViolationField.prop("disabled", false);

    // Handle "Equipment" selection
    if (selectedCategory === "Equipment") {
      $theCodeField.prop("disabled", true).val(""); // Disable and clear the field
      $typeOfViolationField.prop("disabled", true).val("0"); // Disable and set to default
    }

    // Handle "Vehicle" selection
    else if (selectedCategory === "Vehicle") {
      $typeOfViolationField.prop("disabled", true).val("0"); // Disable and set to default
      // theCode field remains enabled
    }
  });
};
const originalResetFilter = confirmedViolationLog.resetFilter;
confirmedViolationLog.resetFilter = function (e) {
  // Call the original resetFilter function
  originalResetFilter.call(this, e);

  // Re-enable both fields after reset
  $("#theCode").prop("disabled", false);
  $("#TypeofViolation").prop("disabled", false);
};

confirmedViolationLog.ConfirmedViolationTable = (
  ConfirmedViolation,
  destroyTable
) => {
  let data = [];
  let taskViolation;
  if (confirmedViolationLog.destroyTable || destroyTable) {
    $("#ConfirmedViolationlog").DataTable().destroy();
  }

  if (ConfirmedViolation.length > 0) {
    ConfirmedViolation.forEach((record) => {
      taskViolation = record.Violation;
      let createdDate = functions.getFormatedDate(record.Created);

      data.push([
        `<div class="violationId" data-taskid="${record.ID}">
          ${taskViolation.ViolationCode}
          </div>`,
        `<div class='controls'>
            <div class='ellipsisButton'>
                <i class='fa-solid fa-ellipsis-vertical'></i>
            </div>
            <div class="hiddenListBox">
                <div class='arrow'></div>
                <ul class='list-unstyled controlsList'>
                    <li><a href="#" class="itemDetails">المزيد من التفاصيل</a></li>    
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
        `${confirmedViolationLog.getViolationStatus(record.Status)}`,
        `${taskViolation?.IsPetition
          ? functions.getPetitionsStatus(
            taskViolation?.Petition?.GridData?.[0]?.Status
          ) || "-"
          : "-"
        }`,
        `${functions.getFormatedDate(record.ReconciliationExpiredDate) ==
          "01-01-2001"
          ? "-"
          : functions.getFormatedDate(record.ReconciliationExpiredDate)
        }`,
        `${createdDate}`,
      ]);
    });
  }

  let Table = functions.tableDeclare(
    "#ConfirmedViolationlog",
    data,
    [
      { title: "رقم المخالفة" },
      { title: "", class: "all" },
      { title: "تصنيف المخالفة" },
      { title: "رقم المحجر/العربة" },
      { title: "إسم الشركة المخالفة" },
      { title: "نوع المخالفة " },
      { title: "المنطقة", visible: true },
      { title: "حالة المخالفة" },
      { title: "حالة الالتماس" },
      { title: "الحد الأقصى للمصالحة" },
      { title: "تاريخ الإنشاء" },
    ],
    false,
    false,
    "سجل المحاضر المصدق عليها.xlsx",
    "سجل المحاضر المصدق عليها"
  );

  // 🔹 create column selector
  functions.createColumnSelector(Table, "#columnSelector", 'green');

  confirmedViolationLog.destroyTable = true;

  let violationlog = Table.rows().nodes().to$();

  $(".ellipsisButton").on("click", (e) => {
    $(".hiddenListBox").hide(300);
    $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
  });

  $.each(violationlog, (index, record) => {
    let jQueryRecord = $(record);
    let taskID = jQueryRecord.find(".violationId").data("taskid");

    jQueryRecord
      .find(".controls")
      .children(".ellipsisButton")
      .on("click", (e) => {
        $(".hiddenListBox").hide(300);
        $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
      });
    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".itemDetails")
      .on("click", (e) => {
        $(".overlay").addClass("active");
        confirmedViolationLog.findViolationByID(e, taskID);
      });
    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".printViolationDetails")
      .on("click", (e) => {
        $(".overlay").addClass("active");
        confirmedViolationLog.findViolationByID(e, taskID, true);
      });
  });
  functions.hideTargetElement(".controls", ".hiddenListBox");
};
confirmedViolationLog.getViolationStatus = (ViolationStatus) => {
  let statusHtml = ``;
  switch (ViolationStatus) {
    case "Pending":
    case "Confirmed": {
      statusHtml = `<div class="statusBox pendingStatus">
                <i class="statusIcon fa-regular fa-clock"></i>
                <span class="statusText">قيد الانتظار</span>
            </div>`;
      break;
    }
    case "Exceeded": {
      statusHtml = `<div class="statusBox warningStatus">
                <img class="statusIcon" src="/Style Library/MiningViolations/images/tringleIcon.svg" alt="warning">
                <span class="statusText">تجاوز مدة السداد</span>
            </div>`;
      break;
    }
    case "Saved": {
      statusHtml = `<div class="statusBox killedStatus">
                <i class="statusIcon fa-solid fa-ban"></i> 
                <span class="statusText">محفوظة</span>
            </div>`;
      break;
    }
    case "Paid After Reffered": {
      statusHtml = `<div class="statusBox closedStatus">
                <i class="statusIcon fa-regular fa-circle-check"></i>
                <span class="statusText">سداد بعد الإحالة</span>
            </div>`;
      break;
    }
    case "Paid": {
      statusHtml = `<div class="statusBox closedStatus">
                <i class="statusIcon fa-regular fa-circle-check"></i>
                <span class="statusText">تم السداد</span>
            </div>`;
      break;
    }
    case "UnderPayment": {
      statusHtml = `<div class="statusBox warningStatus">
                <img class="statusIcon" src="/Style Library/MiningViolations/images/tringleIcon.svg" alt="warning">
                <span class="statusText">قيد السداد</span>
            </div>`;
      break;
    }
    case "Approved": {
      statusHtml = `<div class="statusBox closedStatus">
                <i class="statusIcon fa-regular fa-circle-check"></i>
                <span class="statusText">تم الموافقة</span>
            </div>`;
      break;
    }
    case "Rejected": {
      statusHtml = `<div class="statusBox killedStatus">
                <i class="statusIcon fa-solid fa-ban"></i> 
                <span class="statusText">مرفوضة</span>
            </div>`;
      break;
    }
    case "Reffered": {
      statusHtml = `<div class="statusBox pendingStatus">
                <i class="statusIcon fa-regular fa-paper-plane"></i>
                <span class="statusText">تم الإحالة</span>
            </div>`;
      break;
    }
    case "UnderReview": {
      statusHtml = `<div class="statusBox pendingStatus">
                <i class="statusIcon fa-regular fa-eye"></i>
                <span class="statusText">قيد انتظار السداد</span>
            </div>`;
      break;
    }
    case "ExternalReviewed": {
      statusHtml = `<div class="statusBox pendingStatus">
                <i class="statusIcon fa-regular fa-external-link"></i>
                <span class="statusText">خارجية</span>
            </div>`;
      break;
    }
    case "Completed": {
      statusHtml = `<div class="statusBox closedStatus">
                <i class="statusIcon fa-regular fa-circle-check"></i>
                <span class="statusText">مكتملة</span>
            </div>`;
      break;
    }
    case "Cancelled": {
      statusHtml = `<div class="statusBox killedStatus">
                <i class="statusIcon fa-solid fa-ban"></i> 
                <span class="statusText">ملغاه</span>
            </div>`;
      break;
    }
    default: {
      statusHtml = `<div class="statusBox pendingStatus">
                <i class="statusIcon fa-regular fa-question-circle"></i>
                <span class="statusText">${ViolationStatus || "---"}</span>
            </div>`;
      break;
    }
  }

  return statusHtml;
};
confirmedViolationLog.findViolationByID = (event, taskID, print = false) => {
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
      let violationID;

      if (data != null) {
        violationData = data.d.Violation;
        violationID = data.d.ViolationId;
        violationOffenderType = violationData.OffenderType;
        if (violationOffenderType == "Quarry") {
          Content = DetailsPopup.quarryDetailsPopupContent(
            violationData,
            "المصدق عليها"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup"],
            printBox
          );
        } else if (violationOffenderType == "Vehicle") {
          Content = DetailsPopup.vehicleDetailsPopupContent(
            violationData,
            "المصدق عليها"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup"],
            printBox
          );
          let VehcleType = violationData.VehicleType;
          if (VehcleType == "عربة بمقطورة") {
            $(".TrailerNumberBox").show();
          } else {
            $(".TrailerNumberBox").hide();
          }
        } else if (violationOffenderType == "Equipment") {
          Content = DetailsPopup.equipmentDetailsPopupContent(
            violationData,
            "المصدق عليها"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup"],
            printBox
          );
        }
        $(".popupForm").addClass("Confirmedform");
        $(".totalPriceBox").show().find(".dateLimitBox").hide();
        $(".confirmationAttachBox").show();
        $(".Confirmedform").find(".addConfirmationAttchBox").hide();
        $(".Confirmedform").find(".rejectReasonBox").hide();
        $(".Confirmedform").find(".showFormula").hide();
        if (print) {
          $(".Confirmedform").find(".confirmationAttachBox").show();
          functions.PrintDetails(event);
        }
        $(".printBtn").on("click", (e) => {
          functions.PrintDetails(e);
        });
        $(".detailsPopupForm").addClass("confirmedTasks");
        DetailsPopup.getConfirmationAttachments(taskID);
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

  // ===============================
  // 🔥 فتح المودال
  // ===============================
  $(".contentContainer").on("click", ".violationHistory", function (e) {
    e.preventDefault();
    e.stopPropagation();

    selectedViolationId = $(this).data("violationid");
    selectedViolationCode = $(this).data("violationcode");

    $("#trackHistoryModal").modal("show");
  });

  // ===============================
  // 🔥 إغلاق المودال - Close button handlers
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

  // Close button in header
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
  // 🔥 لما المودال يفتح
  // ===============================
  $(".track-history-modal").on("shown.bs.modal", function () {

    $(".track-history-violation-code").text(selectedViolationCode);

    const request = {
      Request: {
        ViolationId: selectedViolationId,
      },
    };

    const tableElement = $("#trackHistoryTable");

    // ✅ لو أول مرة نعمل init
    if (!trackHistoryTable) {

      trackHistoryTable = tableElement.DataTable({
        processing: true,
        paging: false,
        responsive: true,
        destroy: true,
        // ordering: false,
        // searching: false,
        // info: false,

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

      // ✅ Reload فقط
      trackHistoryTable.ajax.reload();
    }
  });

  // ===============================
  // 🔥 لما المودال يقفل
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

export default confirmedViolationLog;
