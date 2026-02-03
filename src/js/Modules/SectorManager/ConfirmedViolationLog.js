import Swal from "sweetalert2";
import DetailsPopup from "../../Shared/detailsPopupContent";
import functions from "../../Shared/functions";
// Abdelrahman
import { ajaxDatatableHistoryInit } from "../../Shared/ajaxDatatable";
import sharedApis from "../../Shared/sharedApiCall";
import pagination from "../../Shared/Pagination";

import { event } from "jquery";

let confirmedViolationLog = {};
confirmedViolationLog.pageIndex = 1;
confirmedViolationLog.dataObj = {
  destroyTable: false,
  ViolationSector: 0,
  ViolationType: 0,
  ViolationGeneralSearch: "",
};

confirmedViolationLog.getConfirmedLog = (
  pageIndex = 1,
  destroyTable = false,
  ViolationSector = $("#violationSector").children("option:selected").val(),
  ViolationType = Number(
    $("#TypeofViolation").children("option:selected").data("id")
  ),
  ViolationGeneralSearch = $("#violationSearch").val()
) => {
  const theCode =
    $("#violationCategory").val() == "Quarry"
      ? { QuarryCode: $("#theCode").val() }
      : { CarNumber: $("#theCode").val() };

  let request = {
    Data: {
      ...theCode,
      RowsPerPage: 10,
      PageIndex: pagination.currentPage,
      ColName: "created",
      SortOrder: "desc",
      Status: "Confirmed",
      ViolationType: ViolationType,
      SectorConfigId: ViolationSector,
      GlobalSearch: ViolationGeneralSearch,
      ViolatorName: $("#violatorName").val(),
      NationalID: $("#nationalID").val(),
      ViolationCode: $("#violationCode").val(),
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
      confirmedViolationLog.setPaginations(
        ItemsData.TotalPageCount,
        ItemsData.RowsPerPage
      );
      confirmedViolationLog.ConfirmedViolationTable(
        ConfirmedViolation,
        confirmedViolationLog.dataObj.destroyTable
      );
      confirmedViolationLog.pageIndex = ItemsData.CurrentPage;
    })
    .catch((err) => {
      console.log(err);
    });
};

confirmedViolationLog.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", confirmedViolationLog.getConfirmedLog);
  // pagination.reset()
  // pagination.scrollToElement(el, length)
  pagination.activateCurrentPage();
};

confirmedViolationLog.ConfirmedViolationTable = (
  ConfirmedViolation,
  destroyTable
) => {
  if (confirmedViolationLog.dataObj.destroyTable) {
    $("#ConfirmedViolationlog").DataTable().destroy();
  }
  let data = [];
  let taskViolation;
  if (ConfirmedViolation.length > 0) {
    ConfirmedViolation.forEach((record) => {
      taskViolation = record.Violation;
      let createdDate = functions.getFormatedDate(record.Created);
      data.push([
        `<div class="violationId" data-violationid="${taskViolation.ID}" data-taskid="${record.ID}" data-violationcode="${taskViolation.ViolationCode}" data-offendertype="${taskViolation.OffenderType}">${taskViolation.ViolationCode}</div>`,
        `<div class='controls'> 
              <div class='ellipsisButton'>
                  <i class='fa-solid fa-ellipsis-vertical'></i>
              </div>
              <div class="hiddenListBox">
                  <div class='arrow'></div>
                  <ul class='list-unstyled controlsList'>
                      <li><a href="#" class="itemDetails"> المزيد من التفاصيل</a></li>
                      <li><a href="#" data-violationid="${taskViolation.ID}" data-violationcode="${taskViolation.ViolationCode}" class="violationHistory" data-toggle="modal" data-target="#trackHistoryModal">تتبع مرحلة المخالفة</a></li>                  
                  </ul>
              </div>
          </div`,
        `<div class="violationArName">${functions.getViolationArabicName(
          taskViolation.OffenderType
        )}</div>`,
        `<div class="violationCode" >${taskViolation.OffenderType == "Quarry"
          ? taskViolation.QuarryCode
          : taskViolation.CarNumber
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
        `${taskViolation?.IsPetition
          ? functions.getPetitionsStatus(
            taskViolation?.Petition?.GridData?.[0]?.Status
          ) || "-"
          : "-"
        }`,
        `<div class="violationZone">${taskViolation.ViolationsZone}</div>`,
        `${functions.getFormatedDate(taskViolation.ViolationDate)}`,
        `${createdDate}`,
      ]);
    });
  }
  confirmedViolationLog.dataObj.destroyTable = true;
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
      { title: "حالة الالتماس" },
      { title: "المنطقة" },
      { title: "تاريخ الضبط" },
      { title: "تاريخ الإنشاء" },
    ],
    false,
    false,
    "سجل المخالفات المصدق عليها.xlsx",
    "سجل المخالفات المصدق عليها"
  );
  let violationlog = Table.rows().nodes().to$();
  $.each(violationlog, (index, record) => {
    let jQueryRecord = $(record);
    let taskID = jQueryRecord.find(".violationId").data("taskid");
    let violationId = jQueryRecord.find(".violationId").data("violationid");
    let violationCode = jQueryRecord.find(".violationId").data("violationcode");
    let OffenderType = jQueryRecord.find(".violationId").data("offendertype");
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
confirmedViolationLog.filterConfirmedLog = (e) => {
  // let pageIndex = confirmedViolationLog.pageIndex;
  let OffenderTypeVal = $("#violationCategory")
    .children("option:selected")
    .val();
  let ViolationSectorVal = $("#violationSector")
    .children("option:selected")
    .val();
  let ViolationTypeVal = $("#TypeofViolation")
    .children("option:selected")
    .data("id");
  let ViolationGeneralSearch = $("#violationSearch").val();

  if (
    ViolationTypeVal == "" &&
    ViolationSectorVal == "0" &&
    ViolationGeneralSearch == "" &&
    OffenderTypeVal == ""
  ) {
    functions.warningAlert(
      "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
    );
  } else {
    $(".PreLoader").addClass("active");
    confirmedViolationLog.getConfirmedLog();
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

  $(".PreLoader").addClass("active");
  pagination.reset();
  confirmedViolationLog.getConfirmedLog();
};

// Abdelrahman
var selectedViolationId;
var selectedViolationCode;
var trackHistoryTable;
$(".contentContainer").on("click", ".violationHistory", function () {
  selectedViolationId = $(this).data("violationid");
  selectedViolationCode = $(this).data("violationcode");
});

$(".track-history-modal").on("shown.bs.modal", function () {
  $(".track-history-modal").removeClass("generalPopupStyle detailsPopup");
  $(".modal-violation-code").text(selectedViolationCode);
  let request = {
    Request: {
      ViolationId: selectedViolationId,
    },
  };
  // Datatable section
  const columns = ["id", "status", "created", "createdBy", "comment"];
  trackHistoryTable = ajaxDatatableHistoryInit(
    $("#trackHistoryTable"),
    "/_layouts/15/Uranium.Violations.SharePoint/ViolationHistoryLogs.aspx/Search",
    request,
    columns
  );
});
$(".track-history-modal").on("hidden.bs.modal", function () {
  trackHistoryTable.destroy();
  $("#trackHistoryTable tbody").empty();
  $(".modal-violation-code").text("");
});
export default confirmedViolationLog;
