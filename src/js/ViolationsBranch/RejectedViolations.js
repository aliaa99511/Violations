import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import pagination from "../../Shared/Pagination";

let rejectedViolations = {};
rejectedViolations.pageIndex = 1;

rejectedViolations.getRejectedViolations = (
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
      Status: "Rejected",
      PaymentStatus: "قيد الإنتظار",
      ViolationType: ViolationType,
      ViolationsZone: ViolationZone,
    },
  };
  console.log(request);
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
      let RunningViolation = [];
      let ItemsData = data.d.Result;
      if (data.d.Result.GridData != null) {
        if (data.d.Result.GridData.length > 0) {
          Array.from(data.d.Result.GridData).forEach((element) => {
            RunningViolation.push(element);
          });
          console.log(RunningViolation);
        } else {
          RunningViolation = [];
        }
      }
      rejectedViolations.setPaginations(
        ItemsData.TotalPageCount,
        ItemsData.RowsPerPage
      );
      rejectedViolations.rejectedViolationTable(RunningViolation, destroyTable);
      rejectedViolations.pageIndex = ItemsData.CurrentPage;
    })
    .catch((err) => {
      console.log(err);
    });
};

rejectedViolations.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", rejectedViolations.getRejectedViolations);
  // pagination.reset()
  // pagination.scrollToElement(el, length)
  pagination.activateCurrentPage();
};

rejectedViolations.rejectedViolationTable = (
  RunningViolation,
  destroyTable
) => {
  let data = [];
  let taskViolation;
  if (RunningViolation.length > 0) {
    RunningViolation.forEach((record) => {
      taskViolation = record.Violation;
      if (taskViolation != null) {
        data.push([
          `<div class="violationId" data-taskid="${record.ID}" data-violationid="${record.ViolationId}" data-offendertype="${taskViolation.OffenderType}" data-rejectreason="${record.Comment}">${taskViolation.ViolationCode}</div>`,
          `<div class="violationArName">${functions.getViolationArabicName(
            taskViolation.OffenderType
          )}</div>`,
          `<div class="violationCode">${
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
                                <li><a href="#" class="printViolationDetails">طباعة التقرير</a></li>
                            </ul>
                        </div>
                    </div`,
        ]);
      }
    });
  }
  let Table = functions.tableDeclare(
    "#RejectedViolation",
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
  $(".ellipsisButton").on("click", (e) => {
    $(".hiddenListBox").hide(300);
    $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
  });
  let violationlog = Table.rows().nodes().to$();
  $.each(violationlog, (index, record) => {
    let jQueryRecord = $(record);
    let violationTaskID = jQueryRecord.find(".violationId").data("taskid");
    let rejectReason = jQueryRecord.find(".violationId").data("rejectreason");
    let OffenderType = jQueryRecord.find(".violationId").data("offendertype");
    let hiddenListBox = jQueryRecord
      .find(".controls")
      .children(".hiddenListBox");
    if (
      hiddenListBox.height() > 110 &&
      jQueryRecord.is(":nth-last-child(-n + 4)")
    ) {
      hiddenListBox.addClass("toTopDDL");
    }
    // jQueryRecord.find(".controls").children(".ellipsisButton").on("click", (e) => {
    //     $(".hiddenListBox").hide(300);
    //     $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
    // });
    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".itemDetails")
      .on("click", (e) => {
        $(".overlay").addClass("active");
        rejectedViolations.findViolationByID(violationTaskID);
      });
    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".printViolationDetails")
      .on("click", (e) => {
        let Content;
        let printBox;
        if (OffenderType == "Quarry") {
          Content = DetailsPopup.quarryDetailsPopupContent(
            taskViolation,
            "المرفوضة"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup"],
            printBox
          );
        } else {
          Content = DetailsPopup.vehicleDetailsPopupContent(
            taskViolation,
            "المرفوضة"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup"],
            printBox
          );
        }
        console.log(rejectReason);
        $(".rejectReasonBox").show().find(".rejectReason").val(rejectReason);
        // let violatorNameTest =$(".detailsPopup").find(".detailsPopupForm").find(".violatorName").val()
        // console.log(violatorNameTest)
        functions.PrintDetails(e);
      });
  });
  functions.hideTargetElement(".controls", ".hiddenListBox");
};

rejectedViolations.findViolationByID = (violationTaskID) => {
  console.log(violationTaskID);
  let request = {
    Id: violationTaskID,
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
      console.log(data);
      let violationData;
      let violationOffenderType;
      let Content;
      let printBox;
      let rejectReason;
      if (data != null) {
        rejectReason = data.d.Comment;
        violationData = data.d.Violation;
        violationOffenderType = violationData.OffenderType;
        if (violationOffenderType == "Quarry") {
          Content = DetailsPopup.quarryDetailsPopupContent(
            violationData,
            "المرفوضة"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup"],
            printBox
          );
        } else {
          Content = DetailsPopup.vehicleDetailsPopupContent(
            violationData,
            "المرفوضة"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup"],
            printBox
          );
          let VehcleType = violationData.VehicleType;
          if (VehcleType == "مقطورة") {
            $(".TrailerNumberBox").show();
          } else {
            $(".TrailerNumberBox").hide();
          }
        }
        console.log(rejectReason);
        $(".rejectReasonBox").show().find(".rejectReason").val(rejectReason);
        $(".printBtn").on("click", (e) => {
          functions.PrintDetails(e);
        });
      } else {
        violationData = null;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

rejectedViolations.filterViolationsLog = (e) => {
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
    rejectedViolations.getRejectedViolations(
      true,
      ViolationZone,
      ViolationType
    );
  }
};

export default rejectedViolations;
