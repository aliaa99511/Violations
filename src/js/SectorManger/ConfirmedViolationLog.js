import Swal from "sweetalert2";
import DetailsPopup from "../../Shared/detailsPopupContent";
import functions from "../../Shared/functions";
import sharedApis from "../../Shared/sharedApiCall";
import pagination from "../../Shared/Pagination";

let confirmedViolationLog = {};
confirmedViolationLog.pageIndex = 1;

confirmedViolationLog.getConfirmedLog = (
  pageIndex = 1,
  destroyTable = false,
  ViolationZone = "",
  ViolationType = 0
) => {
  let request = {
    Data: {
      RowsPerPage: 10,
      PageIndex: Number(pageIndex),

      ColName: "created",
      SortOrder: "desc",
      Status: "Confirmed",
      PaymentStatus: "",
      ViolationType: ViolationType,
      ViolationsZone: ViolationZone,
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
        destroyTable
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
  let data = [];
  let taskViolation;
  if (ConfirmedViolation.length > 0) {
    ConfirmedViolation.forEach((record) => {
      taskViolation = record.Violation;
      data.push([
        `<div class="violationId" data-violationid="${taskViolation.ID}" data-taskid="${record.ID}" data-violationcode="${taskViolation.ViolationCode}" data-offendertype="${taskViolation.OffenderType}">${taskViolation.ViolationCode}</div>`,
        `<div class="violationArName">${functions.getViolationArabicName(
          taskViolation.OffenderType
        )}</div>`,
        `<div class="violationCode" >${
          taskViolation.OffenderType == "Quarry"
            ? taskViolation.QuarryCode
            : taskViolation.CarNumber
        }</div>`,
        `<div class="companyName">${taskViolation.ViolatorCompany}</div>`,
        `<div class="violationType" data-typeid="${taskViolation.ViolationTypes.ID}">${taskViolation.ViolationTypes.Title}</div>`,
        `<div class="violationZone">${taskViolation.ViolationsZone}</div>`,
        `${functions.getFormatedDate(taskViolation.ViolationDate)}`,
        `<div class='controls'>
              <div class='ellipsisButton'>
                  <i class='fa-solid fa-ellipsis-vertical'></i>
              </div>
              <div class="hiddenListBox">
                  <div class='arrow'></div>
                  <ul class='list-unstyled controlsList'>
                      <li><a href="#" class="itemDetails"> المزيد من التفاصيل</a></li>
                      <li><a href="#" class="printViolationDetails"> طباعة التقرير</a></li>                    
                  </ul>
              </div>
          </div`,
      ]);
    });
  }
  let Table = functions.tableDeclare(
    "#ConfirmedViolationlog",
    data,
    [
      { title: "رقم المخالفة" },
      { title: "تصنيف المخالفة" },
      { title: "رقم المحجر/العربة" },
      { title: "إسم الشركة المخالفة" },
      { title: "نوع المخالفة " },
      { title: "المنطقة" },
      { title: "تاريخ الضبط" },
      { title: "", class: "all" },
    ],
    false,
    destroyTable
  );
  let violationlog = Table.rows().nodes().to$();
  $.each(violationlog, (index, record) => {
    let jQueryRecord = $(record);
    let taskID = jQueryRecord.find(".violationId").data("taskid");
    let violationId = jQueryRecord.find(".violationId").data("violationid");
    let violationCode = jQueryRecord.find(".violationId").data("violationcode");
    let OffenderType = jQueryRecord.find(".violationId").data("offendertype");
    // console.log("violationID))", taskID);
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
        // $(".confirmationAttachBox").show()
        // DetailsPopup.getConfirmationAttachments(taskID)
        // functions.PrintDetails(e);
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
            ["generalPopupStyle", "detailsPopup", "blueHeaderPopup"],
            printBox
          );
        } else {
          Content = DetailsPopup.vehicleDetailsPopupContent(
            violationData,
            "المصدق عليها"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup", "blueHeaderPopup"],
            printBox
          );
          let VehcleType = violationData.VehicleType;
          if (VehcleType == "مقطورة") {
            $(".TrailerNumberBox").show();
          } else {
            $(".TrailerNumberBox").hide();
          }
        }
        $(".printBtn").on("click", (e) => {
          functions.PrintDetails(e);
        });
        if (print) {
          functions.PrintDetails(event);
        }
        $(".totalPriceBox").show().find(".dateLimitBox").hide();
        $(".confirmationAttachBox").show();
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
  let pageIndex = confirmedViolationLog.pageIndex;
  let ViolationZoneVal = $("#violationZone").children("option:selected").val();
  let ViolationTypeVal = $("#TypeofViolation")
    .children("option:selected")
    .data("id");
  let ViolationType;
  let ViolationZone;

  if (ViolationTypeVal == "" && ViolationZoneVal == "") {
    functions.warningAlert(
      "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
    );
  } else if (ViolationZoneVal != "" || ViolationTypeVal != "0") {
    $(".PreLoader").addClass("active");
    ViolationZone = $("#violationZone").children("option:selected").val();
    ViolationType = Number(
      $("#TypeofViolation").children("option:selected").data("id")
    );
    confirmedViolationLog.getConfirmedLog(
      pageIndex,
      true,
      ViolationZone,
      ViolationType
    );
  }
};

export default confirmedViolationLog;
