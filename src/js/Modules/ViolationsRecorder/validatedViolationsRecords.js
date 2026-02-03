import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import pagination from "../../Shared/Pagination";

let validatedViolationsRecords = {};
// validatedViolationsRecords.pageIndex = 1;
validatedViolationsRecords.dataObj = {
  destroyTable: false,
  OffenderType: "",
  ViolationType: 0,
  ViolationStatus: "",
  //MultipleStatus:["Confirmed","Paid","Exceeded","Paid After Reffered","Saved"],
};

validatedViolationsRecords.getViolations = (
  pageIndex = 1,
  destroyTable = false,
  ViolationSector = Number(
    $("#violationSector").children("option:selected").val()
  ),
  ViolationType = Number(
    $("#TypeofViolation").children("option:selected").data("id")
  ),
  ViolationStatus = $("#ViolationStatus").children("option:selected").val(),
  ViolationGeneralSearch = $("#violationSearch").val()
) => {
  let UserId = _spPageContextInfo.userId;
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
      Status: validatedViolationsRecords.dataObj.ViolationStatus,
      // MultipleStatus:validatedViolationsRecords.dataObj.MultipleStatus,
      MultipleStatus: [
        "Confirmed",
        "Paid",
        "Exceeded",
        "Paid After Reffered",
        "Saved",
      ],
      Sector: UserId,
      ViolationType: validatedViolationsRecords.dataObj.ViolationType,
      OffenderType: validatedViolationsRecords.dataObj.OffenderType,
      IsNew: true,
      ViolatorName: $("#violatorName").val(),
      NationalID: $("#nationalID").val(),
      ViolationCode: $("#violationCode").val(),
      ViolationsZone: $("#violationZone").val(),
      GlobalSearch: ViolationGeneralSearch,
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
      if (data.d.Result.GridData != null) {
        if (data.d.Result.GridData.length > 0) {
          Array.from(data.d.Result.GridData).forEach((element) => {
            violationsData.push(element);
          });
        } else {
          violationsData = [];
        }
      }
      validatedViolationsRecords.setPaginations(
        ItemsData.TotalPageCount,
        ItemsData.RowsPerPage
      );
      validatedViolationsRecords.dashBoardTable(violationsData);
      validatedViolationsRecords.dataObj.destroyTable = true;
      // validatedViolationsRecords.pageIndex = ItemsData.CurrentPage;
    })
    .catch((err) => {
      console.log(err);
    });
};
validatedViolationsRecords.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", validatedViolationsRecords.getViolations);
  // pagination.reset()
  // pagination.scrollToElement(el, length)
  pagination.activateCurrentPage();
};
validatedViolationsRecords.dashBoardTable = (violationsData) => {
  let data = [];
  let taskViolation;
  let TaskStatus;

  if (violationsData.length > 0) {
    violationsData.forEach((record) => {
      taskViolation = record.Violation;
      TaskStatus = record.Status;
      let createdDate = functions.getFormatedDate(record.Created);

      // if((TaskStatus == "Confirmed" || TaskStatus == "Paid" || TaskStatus == "Exceeded" || TaskStatus == "Paid After Reffered" || TaskStatus == "Saved")){
      data.push([
        `<div class="violationId" data-taskid="${record.ID}" data-violationid="${record.ViolationId}" data-taskstatus="${record.Status}" data-paymentstatus="${record.PaymentStatus}" data-violationcode="${taskViolation.ViolationCode}" data-totalprice="${taskViolation.TotalPriceDue}" data-enddate="${record.ReconciliationExpiredDate}" data-offendertype="${taskViolation.OffenderType}">${taskViolation.ViolationCode}</div>`,
        `<div class='controls'>
                <div class='ellipsisButton'>
                    <i class='fa-solid fa-ellipsis-vertical'></i>
                </div>
                <div class="hiddenListBox">
                    <div class='arrow'></div>
                    <ul class='list-unstyled controlsList'>
                        <li><a href="#" class="itemDetails">المزيد من التفاصيل</a></li>                     
                    </ul>
                </div>
            </div`,
        `<div class="violationArName">${functions.getViolationArabicName(
          taskViolation.OffenderType
        )}</div>`,
        `<div class="violationCode">${
          taskViolation.OffenderType == "Vehicle"
            ? taskViolation.CarNumber
            : taskViolation.QuarryCode != ""
            ? taskViolation.QuarryCode
            : "---"
        }</div>`,
        `<div class="companyName">${
          taskViolation.ViolatorCompany != ""
            ? taskViolation.ViolatorCompany
            : "-"
        }</div>`,
        `<div class="violationType" data-typeid="${
          taskViolation.OffenderType == "Quarry"
            ? taskViolation.ViolationTypes.ID
            : 0
        }">${functions.getViolationArabicName(
          taskViolation.OffenderType,
          taskViolation?.ViolationTypes?.Title
        )}</div>`,
        `<div class="violationZone">${taskViolation.ViolationsZone}</div>`,
        `${validatedViolationsRecords.getViolationStatus(record.Status)}`,
        `${
          taskViolation?.IsPetition
            ? functions.getPetitionsStatus(
                taskViolation?.Petition?.GridData?.[0]?.Status
              ) || "-"
            : "-"
        }`,
        `${
          functions.getFormatedDate(record.ReconciliationExpiredDate) ==
          "01-01-2001"
            ? "-"
            : functions.getFormatedDate(record.ReconciliationExpiredDate)
        }`,
        `${createdDate}`,
      ]);
      // }
      // <li><a href="#" class="printViolationDetails">طباعة التقرير</a></li>
    });
  }
  let Table = functions.tableDeclare(
    "#validatedViolationsRecords",
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
    validatedViolationsRecords.dataObj.destroyTable,
    "سجل المحاضر المصدق عليها.xlsx",
    "سجل المحاضر المصدق عليها"
  );
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
        validatedViolationsRecords.findViolationByID(e, taskID);
      });
    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".printViolationDetails")
      .on("click", (e) => {
        $(".overlay").addClass("active");
        validatedViolationsRecords.findViolationByID(e, taskID, true);
      });
  });
  functions.hideTargetElement(".controls", ".hiddenListBox");
};

validatedViolationsRecords.getViolationStatus = (ViolationStatus) => {
  let statusHtml = ``;
  switch (ViolationStatus) {
    case "Confirmed": {
      statusHtml = `<div class="statusBox pendingStatus">
              <i class="statusIcon fa-regular fa-clock"></i>
              <span>قيد الإنتظار</span>
          </div>`;
      break;
    }
    case "Exceeded": {
      statusHtml = `<div class="statusBox warningStatus">
              <img class="statusIcon" src="/Style Library/MiningViolations/images/tringleIcon.svg" alt="warning">
              <span>تجاوز مدة السداد</span>
          </div>`;
      break;
    }
    case "Saved": {
      statusHtml = `<div class="statusBox killedStatus">
              <i class="statusIcon fa-solid fa-ban"></i> 
              <span>حفظ بعد الإحالة</span>
          </div>`;
      break;
    }
    case "Paid After Reffered": {
      statusHtml = `<div class="statusBox closedStatus">
              <i class="statusIcon fa-regular fa-circle-check"></i>
              <span>سداد بعد الإحالة</span>
          </div>`;
      break;
    }
    case "Paid": {
      statusHtml = `<div class="statusBox closedStatus">
              <i class="statusIcon fa-regular fa-circle-check"></i>
              <span>تم السداد</span>
          </div>`;
      break;
    }
  }

  return statusHtml;
};
validatedViolationsRecords.findViolationByID = (
  event,
  taskID,
  print = false
) => {
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
      let TaskData;
      let TaskId;
      let ExDate;
      if (data != null) {
        TaskData = data.d;
        violationData = TaskData.Violation;
        TaskId = TaskData.ID;
        ExDate = functions.getFormatedDate(TaskData.ReconciliationExpiredDate);
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
        } else if (violationOffenderType == "Vehicle") {
          Content = DetailsPopup.vehicleDetailsPopupContent(
            violationData,
            "المصدق عليها"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup", "blueHeaderPopup"],
            printBox
          );
          let vehicleType = violationData.VehicleType;
          if (vehicleType == "عربة بمقطورة") {
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
        $(".detailsPopupForm").addClass("validatedViolationsRecordsLog");
        $(".validatedViolationsRecordsLog").find(".totalPriceBox").show();
        $(".totalPriceBox").find(".violationEndTime").val(ExDate);
        $(".confirmationAttachBox").show();
        DetailsPopup.getConfirmationAttachments(TaskId);
      } else {
        violationData = null;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};
validatedViolationsRecords.filterViolationsLog = (e) => {
  // let pageIndex = validatedViolationsRecords.pageIndex;
  let OffenderTypeVal = $("#violationCategory")
    .children("option:selected")
    .val();
  let ViolationTypeVal = $("#TypeofViolation")
    .children("option:selected")
    .data("id");
  let ViolationStatusVal = $("#ViolationStatus")
    .children("option:selected")
    .val();
  let ViolationGeneralSearch = $("#violationSearch").val();
  let violationSector = $("#violationSector").children("option:selected").val();
  // let ViolationType;
  // let offenderType;
  // let ViolationStatus;

  if (
    ViolationTypeVal == "" &&
    OffenderTypeVal == "" &&
    ViolationStatusVal == "" &&
    ViolationGeneralSearch == "" &&
    violationSector == "0"
  ) {
    functions.warningAlert(
      "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
    );
  } else {
    $(".PreLoader").addClass("active");
    validatedViolationsRecords.dataObj.OffenderType = $("#violationCategory")
      .children("option:selected")
      .val();
    validatedViolationsRecords.dataObj.ViolationType = Number(
      $("#TypeofViolation").children("option:selected").data("id")
    );
    validatedViolationsRecords.dataObj.ViolationStatus = $("#ViolationStatus")
      .children("option:selected")
      .val();
    // validatedViolationsRecords.dataObj.MultipleStatus = [validatedViolationsRecords.dataObj.ViolationStatus]
    validatedViolationsRecords.dataObj.destroyTable = true;
    validatedViolationsRecords.dataObj.pageIndex = pagination.currentPage;
    validatedViolationsRecords.getViolations();
  }
};

validatedViolationsRecords.resetFilter = (e) => {
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

  validatedViolationsRecords.dataObj.OffenderType = "";
  validatedViolationsRecords.dataObj.ViolationType = 0;
  validatedViolationsRecords.dataObj.ViolationStatus = "";

  $(".PreLoader").addClass("active");
  pagination.reset();
  validatedViolationsRecords.getViolations();
};

export default validatedViolationsRecords;
