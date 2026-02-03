import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import confirmPopup from "../../Shared/confirmationPopup";
import pagination from "../../Shared/Pagination";

import { ajaxDatatableHistoryInit } from "../../Shared/ajaxDatatable";

let validatedViolations = {};
validatedViolations.pageIndex = 1;
validatedViolations.destroyTable = false;
// let destroyTable = false;
validatedViolations.getValidatedViolations = (
  pageIndex = 1,
  destroyTable = false,
  ViolationSector = Number(
    $("#violationSector").children("option:selected").val(),
  ),
  ViolationType = Number(
    $("#TypeofViolation").children("option:selected").data("id"),
  ),
  ViolationStatus = $("#ViolationStatus").children("option:selected").val(),
  ViolationGeneralSearch = $("#violationSearch").val(),
) => {
  let UserId = _spPageContextInfo.userId;
  const theCode =
    $("#violationCategory").val() == "Quarry"
      ? { QuarryCode: $("#theCode").val() }
      : { CarNumber: $("#theCode").val() };
  let ShownRows = 10;

  let request = {
    Data: {
      ...theCode,
      RowsPerPage: ShownRows,
      PageIndex: pagination.currentPage,
      ColName: "created",
      SortOrder: "desc",
      Status: ViolationStatus,
      MultipleStatus: [
        "Confirmed",
        "Paid",
        "Exceeded",
        "Paid After Reffered",
        "Saved",
      ],
      VolationType: ViolationType,
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
      let ValidatedViolation = [];

      let ItemsData = data.d.Result;
      if (data.d.Result.GridData != null) {
        if (data.d.Result.GridData.length > 0) {
          Array.from(data.d.Result.GridData).forEach((element) => {
            ValidatedViolation.push(element);
          });
        } else {
          ValidatedViolation = [];
        }
      }
      validatedViolations.setPaginations(
        ItemsData.TotalPageCount,
        ItemsData.RowsPerPage,
      );
      validatedViolations.ValidatedViolationTable(
        ValidatedViolation,
        destroyTable || validatedViolations.destroyTable,
      );
      validatedViolations.destroyTable = true;
      validatedViolations.pageIndex = ItemsData.CurrentPage;
    })
    .catch((err) => { });
};

validatedViolations.filterViolationsLog = (e) => {
  let pageIndex = validatedViolations.pageIndex;
  let OffenderTypeVal = $("#violationCategory")
    .children("option:selected")
    .val();
  let ViolationTypeVal = $("#TypeofViolation")
    .children("option:selected")
    .data("id");
  let ViolationGeneralSearch = $("#violationSearch").val();
  let ViolationStatus = $("#ViolationStatus").children("option:selected").val();
  let UserSector = $("#violationSector").children("option:selected").val();

  if (
    ViolationTypeVal == "" &&
    OffenderTypeVal == "" &&
    ViolationGeneralSearch == "" &&
    ViolationStatus == "" &&
    UserSector == "0"
  ) {
    functions.warningAlert(
      "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث",
    );
  } else {
    $(".PreLoader").addClass("active");
    validatedViolations.getValidatedViolations(pageIndex, true);
  }
};

validatedViolations.resetFilter = (e) => {
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
  validatedViolations.getValidatedViolations(1, true);
};
validatedViolations.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", validatedViolations.getValidatedViolations);
  pagination.activateCurrentPage();
};
validatedViolations.ValidatedViolationTable = (ValidatedViolation) => {
  let data = [];
  let taskViolation;
  let TaskStatus;
  let violationDate;
  let taskId;
  let violationId;
  let paymentStatus;
  let CurrentDate = functions.getCurrentDateTime("Date");
  if (ValidatedViolation.length > 0) {
    ValidatedViolation.forEach((record) => {
      taskViolation = record.Violation;
      taskId = record.ID;
      violationId = record.ViolationId;
      TaskStatus = record.Status;
      paymentStatus = record.PaymentStatus;
      let date = functions.getFormatedDate(record.ReconciliationExpiredDate);
      let DateYear = date.split("-")[2];
      let ExpiredDate;
      violationDate = functions.getFormatedDate(
        record.ReconciliationExpiredDate,
      );
      let createdDate = functions.getFormatedDate(record.Created);
      if (
        moment(new Date()).format("MM-DD-YYYY") >
        moment(record.ReconciliationExpiredDate).format("MM-DD-YYYY") &&
        DateYear > 2020 &&
        TaskStatus == "Confirmed"
      ) {
        validatedViolations.violationExceedTimeStatusChange(
          taskId,
          violationId,
        );
      }
      if (DateYear > 2020) {
        ExpiredDate = functions.getFormatedDate(
          record.ReconciliationExpiredDate,
        );
      } else {
        ExpiredDate = "-";
      }
      // if((TaskStatus == "Confirmed" || TaskStatus == "Paid" || TaskStatus == "Exceeded" || TaskStatus == "Paid After Reffered" || TaskStatus == "Saved")){
      data.push([
        `<div class="violationId" data-taskid="${record.ID
        }" data-violationid="${record.ViolationId}" data-taskstatus="${record.Status
        }" data-paymentstatus="${record.PaymentStatus}" data-violationcode="${taskViolation?.ViolationCode
        }" data-totalprice="${taskViolation?.TotalPriceDue}" data-enddate="${record.ReconciliationExpiredDate
        }" data-offendertype="${taskViolation?.OffenderType}">${taskViolation?.ViolationCode != undefined
          ? taskViolation?.ViolationCode
          : "-"
        }</div>`,
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
          taskViolation?.OffenderType,
        )}</div>`,
        `<div class="violationCode">${taskViolation?.OffenderType == "Vehicle"
          ? taskViolation?.CarNumber
          : taskViolation?.QuarryCode != undefined
            ? taskViolation?.QuarryCode
            : "-"
        }</div>`,
        `<div class="companyName">${taskViolation?.ViolatorCompany != undefined
          ? taskViolation?.ViolatorCompany
          : "-"
        }</div>`,
        `<div class="violationType" data-typeid="${taskViolation?.OffenderType == "Quarry"
          ? taskViolation?.ViolationTypes.ID
          : 0
        }">${functions.getViolationArabicName(
          taskViolation.OffenderType,
          taskViolation?.ViolationTypes?.Title,
        )}</div>`,
        `<div class="violationZone">${taskViolation?.ViolationsZone != undefined
          ? taskViolation?.ViolationsZone
          : "-"
        }</div>`,
        `${validatedViolations.getViolationStatus(record.Status)}`,
        `${taskViolation?.IsPetition
          ? functions.getPetitionsStatus(
            taskViolation?.Petition?.GridData?.[0]?.Status,
          ) || "-"
          : "-"
        }`,
        `${ExpiredDate}`,
        `${createdDate}`,
      ]);
      // }
    });
  }
  if (validatedViolations.destroyTable) {
    $("#ValidatedViolation").DataTable().destroy();
  }
  let Table = functions.tableDeclare(
    "#ValidatedViolation",
    data,
    [
      { title: "رقم المخالفة" },
      { title: "", class: "all" },
      { title: "تصنيف المخالفة" },
      { title: "رقم المحجر/العربة" },
      { title: "إسم الشركة المخالفة" },
      { title: "نوع المخالفة " },
      { title: "المنطقة" },
      { title: "حالة المخالفة" },
      { title: "حالة الإلتماس" },
      { title: "الحد الأقصى للمصالحة" },
      { title: "تاريخ الإنشاء" },
    ],
    false,
    false,
    "المخالفات المصدق عليها.xlsx",
    "المخالفات المصدق عليها",
  );

  $(".ellipsisButton").on("click", (e) => {
    $(".hiddenListBox").hide(300);
    $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
  });
  let UserId = _spPageContextInfo.userId;
  let violationlog = Table.rows().nodes().to$();
  validatedViolations.destroyTable = true;
  functions.callSharePointListApi("Configurations").then((Users) => {
    let UserDetails;
    let UsersData = Users.value;
    UsersData.forEach((User) => {
      if (User.UserIdId.find((id) => id == UserId)) {
        UserDetails = User;
      }
    });
    $(".detailsPopupForm").addClass("validatedViolations");
    $.each(violationlog, (index, record) => {
      let jQueryRecord = $(record);
      let offenderType = jQueryRecord.find(".violationId").data("offendertype");
      let violationTaskID = jQueryRecord.find(".violationId").data("taskid");
      let violationID = jQueryRecord.find(".violationId").data("violationid");
      let violationCode = jQueryRecord
        .find(".violationId")
        .data("violationcode");
      let taskStatus = jQueryRecord.find(".violationId").data("taskstatus");
      let paymentStatus = jQueryRecord
        .find(".violationId")
        .data("paymentstatus");
      let hiddenListBox = jQueryRecord
        .find(".controls")
        .children(".hiddenListBox");
      let TotalPrice = jQueryRecord.find(".violationId").data("totalprice");
      let EndDate = jQueryRecord.find(".violationId").data("enddate");
      // <li><a href="#" class="editViolation">تعديل المخالفة</a></li>

      switch (taskStatus) {
        case "Confirmed": {
          jQueryRecord
            .find(".controls")
            .children(".hiddenListBox")
            .find(".controlsList").append(`
                            <li><a href="#" class="printPaymentForm">طباعة نموذج السداد</a></li>
                            <li><a href="#" class="payViolation">تسديد المخالفة</a></li>
                            <li><a href="#" class="requestPetition">تقديم بيان التماس</a></li>
                            <li><a href="#" class="reffereViolation">إحالة إلى النيابة المختصة</a></li>

                        `);
          break;
        }
        case "Exceeded": {
          jQueryRecord
            .find(".controls")
            .children(".hiddenListBox")
            .find(".controlsList").append(`
                            <li><a href="#" class="reffereViolation">إحالة إلى النيابة المختصة</a></li>
                            <li><a href="#" class="payViolation">تسديد المخالفة</a></li>
                            <li><a href="#" class="requestPetition">تقديم بيان التماس</a></li>
                        `);
          break;
        }
      }

      if (
        violationlog.length > 4 &&
        hiddenListBox.height() > 110 &&
        jQueryRecord.is(":nth-last-child(-n + 4)")
      ) {
        hiddenListBox.addClass("toTopDDL");
      }
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".itemDetails")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          validatedViolations.findViolationByID(e, violationTaskID, "Details");
        });
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".printPaymentForm")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          validatedViolations.findViolationByID(
            e,
            violationTaskID,
            "PaymentFormPrint",
          );
        });
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".payViolation")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          validatedViolations.findViolationByID(
            e,
            violationTaskID,
            "PaymentForm",
          );
        });
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".reffereViolation")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          validatedViolations.reffereViolationToCase(
            violationTaskID,
            violationID,
            violationCode,
            offenderType,
            TotalPrice,
          );
        });
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".killViolation")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          confirmPopup.updateTaskStatusPopup(
            violationTaskID,
            violationCode,
            violationID,
            "Kill",
          );
        });
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".editViolation")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          validatedViolations.editViolationDataPopup(
            violationTaskID,
            violationID,
            violationCode,
            TotalPrice,
            EndDate,
          );
        });
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".requestPetition")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          validatedViolations.requestNewPetition(
            violationTaskID,
            violationID,
            violationCode,
          );
        });
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".printViolationDetails")
        .on("click", (e) => {
          validatedViolations.findViolationByID(
            e,
            violationTaskID,
            "Details",
            true,
          );
        });
    });
    functions.getCurrentUserActions();
  });
  functions.hideTargetElement(".controls", ".hiddenListBox");
};
validatedViolations.getViolationStatus = (ViolationStatus) => {
  let statusHtml = ``;
  switch (ViolationStatus) {
    case "Confirmed": {
      statusHtml = `<div class="statusBox pendingStatus">
                <i class="statusIcon fa-regular fa-clock"></i>
                <span class="statusText">قيد الإنتظار</span>
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
                <span class="statusText">حفظ بعد الإحالة</span>
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
  }

  return statusHtml;
};
validatedViolations.findViolationByID = (
  event,
  violationTaskID,
  popupType = "",
  print = false,
) => {
  let request = {
    Id: violationTaskID,
  };
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/FindbyId",
      request,
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      let violationData,
        violationOffenderType,
        Content,
        TaskId,
        paymentForm,
        TaskData,
        printBox,
        ExDate,
        PrintedCount;
      if (data != null) {
        TaskData = data.d;

        violationData = TaskData.Violation;

        TaskId = TaskData.ID;

        ExDate = functions.getFormatedDate(TaskData.ReconciliationExpiredDate);
        violationOffenderType = violationData.OffenderType;
        PrintedCount = TaskData.PrintedCount;
        if (violationOffenderType == "Quarry") {
          if (popupType == "PaymentForm") {
            $(".overlay").removeClass("active");
            Content = DetailsPopup.quarryDetailsPopupContent(
              violationData,
              "المصدق عليها",
            );
            paymentForm = validatedViolations.paymentFormHtml(TaskData);
            Content += paymentForm;
            printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
            functions.declarePopup(
              ["generalPopupStyle", "detailsPopup"],
              printBox,
            );
          } else if (popupType == "PaymentFormPrint") {
            $(".overlay").removeClass("active");
            Content = DetailsPopup.printPaymentForm(TaskData);
            functions.declarePopup(
              ["generalPopupStyle", "paymentFormDetailsPopup"],
              Content,
            );
          } else {
            Content = DetailsPopup.quarryDetailsPopupContent(
              violationData,
              "المصدق عليها",
            );
            printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
            functions.declarePopup(
              ["generalPopupStyle", "detailsPopup"],
              printBox,
            );
          }
        } else if (violationOffenderType == "Vehicle") {
          let VehcleType = violationData.VehicleType;
          if (popupType == "PaymentForm") {
            $(".overlay").removeClass("active");
            Content = DetailsPopup.vehicleDetailsPopupContent(
              violationData,
              "المصدق عليها",
            );
            paymentForm = validatedViolations.paymentFormHtml(TaskData);
            Content += paymentForm;
            printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
            functions.declarePopup(
              ["generalPopupStyle", "detailsPopup"],
              printBox,
            );
          } else if (popupType == "PaymentFormPrint") {
            $(".overlay").removeClass("active");
            Content = DetailsPopup.printPaymentForm(TaskData);
            functions.declarePopup(
              ["generalPopupStyle", "paymentFormDetailsPopup"],
              Content,
            );
          } else {
            Content = DetailsPopup.vehicleDetailsPopupContent(
              violationData,
              "المصدق عليها",
            );
            printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
            functions.declarePopup(
              ["generalPopupStyle", "detailsPopup"],
              printBox,
            );
          }
          if (VehcleType == "عربة بمقطورة") {
            $(".TrailerNumberBox").show();
          } else {
            $(".TrailerNumberBox").hide();
          }
        } else if (violationOffenderType == "Equipment") {
          if (popupType == "PaymentForm") {
            $(".overlay").removeClass("active");
            Content = DetailsPopup.equipmentDetailsPopupContent(
              violationData,
              "المصدق عليها",
            );
            paymentForm = validatedViolations.paymentFormHtml(TaskData);
            Content += paymentForm;
            printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
            functions.declarePopup(
              ["generalPopupStyle", "detailsPopup"],
              printBox,
            );
          } else if (popupType == "PaymentFormPrint") {
            $(".overlay").removeClass("active");
            Content = DetailsPopup.printPaymentForm(TaskData);
            functions.declarePopup(
              ["generalPopupStyle", "paymentFormDetailsPopup"],
              Content,
            );
          } else {
            Content = DetailsPopup.equipmentDetailsPopupContent(
              violationData,
              "المصدق عليها",
            );
            printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
            functions.declarePopup(
              ["generalPopupStyle", "detailsPopup"],
              printBox,
            );
          }
        }
        validatedViolations.popupPermissionShowTypes(popupType, TaskId, ExDate);
        validatedViolations.paymentFormActions();
        $(".printBtn").on("click", (e) => {
          functions.PrintDetails(e);
        });
        if (print) {
          functions.PrintDetails(event);
        }
        $(".printConfirmationForm").hide();
        $(".printPaymentForm").on("click", (e) => {
          functions.PrintDetails(e);
        });
        $(".printPaymentFormBtn").on("click", (e) => {
          validatedViolations.setExpirationDate(
            TaskId,
            PrintedCount,
            violationOffenderType,
          );
          functions.PrintDetails(e);
        });
        $(".detailsPopupForm").addClass("validatedViolations");
      } else {
        violationData = null;
      }
    })
    .catch((err) => { });
};

validatedViolations.setExpirationDate = (
  TaskId,
  PrintedCount,
  violationOffenderType,
) => {
  // $(".modal:last-child").attr("aria-label","Close")
  // $(".modal:last-child").attr("data-dismiss","modal")
  let request = {};
  let ExpirationDate;

  if (PrintedCount == 0) {
    if (violationOffenderType == "Quarry") {
      ExpirationDate = functions.getNDaysAfterCurrentDate(30);
    } else if (violationOffenderType == "Vehicle") {
      ExpirationDate = functions.getNDaysAfterCurrentDate(15);
    } else if (violationOffenderType == "Equipment") {
      ExpirationDate = functions.getNDaysAfterCurrentDate(30);
    }
    request = {
      Data: {
        ID: TaskId,
        PrintedCount: 1,
        ReconciliationExpiredDate: ExpirationDate,
      },
    };
  } else {
    PrintedCount += 1;
    request = {
      Data: {
        ID: TaskId,
        PrintedCount: PrintedCount,
      },
    };
  }

  validatedViolations.setExpirationDateAPI(request);
};
validatedViolations.setExpirationDateAPI = (request) => {
  functions
    .requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save", {
      request,
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => { })
    .catch((err) => { });
};

validatedViolations.popupPermissionShowTypes = (popupType, TaskId, ExDate) => {
  if (popupType == "Details") {
    $(".totalPriceBox")
      .show()
      .find(".violationEndTime")
      .val(ExDate == "01-01-2001" ? "-" : ExDate);
    $(".confirmationAttachBox").show();
    DetailsPopup.getConfirmationAttachments(TaskId);
  }
  // else if(popupType == "PaymentFormPrint"){
  //     $(".totalPriceBox").show().find(".violationEndTime").val(ExDate)
  //     $(".printPaymentForm").css("display","flex")
  // }
  else if (popupType == "PaymentForm") {
    $(".hiddenDetailsBox").addClass("showHiddenDetailsBox");
    $(".totalPriceBox")
      .show()
      .find(".violationEndTime")
      .val(ExDate == "01-01-2001" ? "-" : ExDate);
    $(".popupFormBoxHeader").show();
    $(".confirmationAttachBox").show();
    DetailsPopup.getConfirmationAttachments(TaskId);
    $(".detailsPopupForm").find(".formButtonsBox").hide();
    $(".hiddenDetailsBox").hide();
    $(".showMoreDetails").css("display", "flex");
    $(".showMoreDetails").on("click", (e) => {
      $(".hiddenDetailsBox").slideToggle();
      $(".showMoreDetails").find("img").toggleClass("rotateDetailsIcon");
      $(".showMoreDetails")
        .find("p")
        .text(
          $(".showMoreDetails").find("p").text() == "إظهار المزيد من التفاصيل"
            ? "إخفاء التفاصيل"
            : "إظهار المزيد من التفاصيل",
        );
    });
  }
};
validatedViolations.paymentFormHtml = (TaskData) => {
  let offenderType = TaskData.Violation.OffenderType;
  let violationPriceType =
    TaskData.Violation.ViolationTypes != null
      ? TaskData.Violation.ViolationTypes.PriceType
      : "";
  let TotalViolationPrice = TaskData.Violation.TotalPriceDue;
  let RoyaltyPrice = TaskData.Violation.LawRoyalty;
  let QuarryMaterialValue = TaskData.Violation.QuarryMaterialValue;
  // let FinesValue = TaskData.Violation.TotalPriceDue;
  let violationTypeLastPrice;
  let labelText;
  let inputVal;
  if (offenderType == "Quarry") {
    violationTypeLastPrice = DetailsPopup.getQuarryViolationValueByType(
      violationPriceType,
      TotalViolationPrice,
      QuarryMaterialValue,
    );
    labelText = violationTypeLastPrice.labelText;
    inputVal = violationTypeLastPrice.InputVal;
  } else {
    violationTypeLastPrice = DetailsPopup.getVechileViolationValueByType(
      TotalViolationPrice,
      RoyaltyPrice,
    );
    labelText = violationTypeLastPrice.labelText;
    inputVal = violationTypeLastPrice.InputVal;
  }

  let quarryPriceInDetails = `
        <div class="col-md-4 violationPriceBox">
            <div class="form-group customFormGroup">
                <label for="quarryPrice" class="customLabel">${labelText}</label>
                <input class="form-control customInput quarryPrice disabledInput" id="quarryPrice" type="text" value="${functions.splitBigNumbersByComma(
    inputVal,
  )}" disabled>
            </div>
        </div>
        <div class="col-md-4 royaltyPriceBox">
            <div class="form-group customFormGroup">
                <label for="royaltyPrice" class="customLabel">قيمة الإتاوة</label>
                <input class="form-control customInput royaltyPrice disabledInput" id="royaltyPrice" type="text" value="${functions.splitBigNumbersByComma(
    TaskData?.Violation?.LawRoyalty,
  )}" disabled>
            </div>
        </div>
        <div class="col-md-4 equipmentsPriceBox">
            <div class="form-group customFormGroup">
                <label for="equipmentsPrice" class="customLabel">غرامة المعدات</label>
                <input class="form-control customInput equipmentsPrice disabledInput" id="equipmentsPrice" type="text" value="${functions.splitBigNumbersByComma(
    TaskData?.Violation?.TotalEquipmentsPrice,
  )}" disabled>
            </div>
        </div>
    `;
  let vehiclePriceInDetails = `
        <div class="col-md-6">
            <div class="form-group customFormGroup">
                <label for="quarryPrice" class="customLabel">${labelText}</label>
                <input class="form-control customInput quarryPrice disabledInput" id="quarryPrice" type="text" value="${functions.splitBigNumbersByComma(
    inputVal,
  )}" disabled>
            </div>
        </div>
        <div class="col-md-6">
            <div class="form-group customFormGroup">
                <label for="royaltyPrice" class="customLabel">قيمة الإتاوة</label>
                <input class="form-control customInput royaltyPrice disabledInput" id="royaltyPrice" type="text" value="${functions.splitBigNumbersByComma(
    TaskData?.Violation?.LawRoyalty,
  )}" disabled>
            </div>
    </div>
    `;
  let equipmentsPriceInDetails = `
  

        
        <div class="col-md-6 equipmentsPriceBox">
            <div class="form-group customFormGroup">
                <label for="equipmentsPrice" class="customLabel">غرامة المعدات</label>
                <input class="form-control customInput equipmentsPrice disabledInput" id="equipmentsPrice" type="text" value="${functions.splitBigNumbersByComma(
    TaskData?.Violation?.TotalEquipmentsPrice,
  )}" disabled>
            </div>
        </div>
        `;
  let paymentFormHtml = `
        <div class="paymentFormBody">
            <div class="popupForm paymentForm" id="paymentForm" data-taskid="${TaskData.ID
    }" data-violationid="${TaskData.ViolationId}" data-actualprice="${TaskData.Violation.ActualAmountPaid
    } " data-lawroyalty="${TaskData.Violation.LawRoyalty
    }" data-totalequipmentsprice="${TaskData.Violation.TotalEquipmentsPrice
    }" data-totalprice="${TaskData.Violation.TotalPriceDue}" data-offendertype="${TaskData.Violation.OffenderType
    }" data-violationpricetype="${offenderType == "Quarry"
      ? TaskData.Violation.ViolationTypes.PriceType
      : 0
    }">
                <div class="formContent">
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                ${offenderType == "Quarry"
      ? quarryPriceInDetails
      : offenderType == "Vehicle"
        ? vehiclePriceInDetails
        : offenderType == "Equipment"
          ? equipmentsPriceInDetails
          : ""
    }
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="totalPrice" class="customLabel">المبلغ المطلوب تسديده كامل</label>
                                        <input class="form-control customInput totalPrice disabledInput" id="totalPrice" type="text" value="${functions.splitBigNumbersByComma(
      TaskData?.Violation?.TotalPriceDue,
    )}" disabled>
                                    </div>
                                    <div class="form-group customFormGroup">
                                        <label for="reconciliationPeriod" class="customLabel">تاريخ نهاية مدة التصالح</label>
                                        <div class="inputIconBox">
                                            <input class="form-control customInput reconciliationPeriod disabledInput" id="reconciliationPeriod" type="text" value="${functions.getFormatedDate(
      TaskData?.ReconciliationExpiredDate,
    ) == "01-01-2001"
      ? "-"
      : functions.getFormatedDate(
        TaskData?.ReconciliationExpiredDate,
      )
    }" disabled>
                                            <i class="fa-solid fa-calendar-days"></i>
                                        </div>
                                    </div>
                                    <div class="form-group customFormGroup">
                                        <div class="feildInfoBox">
                                            <label for="payedPrice" class="customLabel">المبلغ المراد تسديده *</label>
                                            <span class="metaDataSpan">بالجنيه المصري</span>
                                        </div>
                                        <input class="form-control customInput payedPrice greenCustomInput" id="payedPrice" type="text" placeholder="ادخل المبلغ المراد تسديده">
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    ${offenderType != "Equipment"
      ? `
                                    <div class="form-group customFormGroup payQuarryAttachBox">
                                        <label for="attachQuarryPaymentReceipt" class="customLabel">إرفاق إيصال غرامة القيمة المحجرية</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <input type="file" class="customInput attachFilesInput attachQuarryPaymentReceipt form-control" id="attachQuarryPaymentReceipt" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx">
                                            </div>
                                        </div>
                                        <div class="dropFilesArea" id="dropFilesArea"></div>
                                    </div>
                                    <div class="form-group customFormGroup payRoyaltyAttachBox">
                                        <label for="attachLawRoyaltyPaymentReceipt" class="customLabel">إرفاق إيصال الإتاوة</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <input type="file" class="customInput attachFilesInput attachLawRoyaltyPaymentReceipt form-control" id="attachLawRoyaltyPaymentReceipt" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx">
                                            </div>
                                        </div>
                                        <div class="dropFilesArea" id="dropFilesArea"></div>
                                    </div>
                                    `
      : ""
    }
                                    
                                    <div class="form-group customFormGroup payEquipmentsAttachBox" style="display:${offenderType == "Quarry" ||
      offenderType == "Equipment"
      ? "block !important"
      : "none !important"
    }">
                                        <label for="attachEquipmentsPaymentReceipt" class="customLabel">إرفاق إيصال غرامة المعدات</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <input type="file" class="customInput attachFilesInput attachEquipmentsPaymentReceipt form-control" id="attachEquipmentsPaymentReceipt" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx">
                                            </div>
                                        </div>
                                        <div class="dropFilesArea" id="dropFilesArea"></div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

                <div class="formButtonsBox">
                    <div class="row">
                        <div class="col-12">
                            <div class="buttonsBox centerButtonsBox ">
                                <div class="btnStyle confirmBtnGreen popupBtn payAllPrice" id="payAllPrice">تسديد وإنهاء المخالفة </div>
                                <div class="btnStyle cancelBtn popupBtn closeDetailsPopup" id="closeDetailsPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    `;
  return paymentFormHtml;
};

{
  /* <div class="form-group customFormGroup actualPayedPriceBox">
    <label for="actualPricePayed" class="customLabel">المبلغ المدفوع</label>
    <input class="form-control customInput actualPricePayed disabledInput" id="actualPricePayed" type="text" value="${functions.splitBigNumbersByComma(TaskData.Violation.ActualAmountPaid)}" disabled>
</div>
<div class="form-group customFormGroup actualRemainigPriceBox">
    <label for="actualPriceRemainig" class="customLabel">المبلغ المتبقي</label>
    <input class="form-control customInput actualPriceRemainig disabledInput" id="actualPriceRemainig" type="text" value="${functions.splitBigNumbersByComma((TaskData.Violation.TotalPriceDue - TaskData.Violation.ActualAmountPaid))}" disabled>
</div> 
<div class="btnStyle cancelBtn popupBtn payPartPrice" id="payPartPrice">تسديد جزء من المخالفة</div>*/
}

validatedViolations.paymentFormActions = () => {
  let request = {};
  let violtionPriceType = $(".paymentForm").data("violationpricetype");
  let offenderType = $(".paymentForm").data("offendertype");
  let lawRoyalty = $(".paymentForm").data("lawroyalty");
  let totalEquipmentsPrice = $(".paymentForm").data("totalequipmentsprice");
  let taskId = $(".paymentForm").data("taskid");
  let violationId = $(".paymentForm").data("violationid");
  let TotalPrice = $(".paymentForm").data("totalprice");
  let ActualPrice = $(".paymentForm").data("actualprice");
  let payedPrice = $(".payedPrice").val();
  let currentPrice;
  let PositiveDecimalNumbers = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;
  let NumbersRegex =
    /(?:^|\s)(?=.)((?:0|(?:[1-9](?:\d*|\d{0,2}(?:,\d{3})*)))?(?:\.\d*[1-9])?)(?!\S)/;
  let filesExtension = [
    "gif",
    "svg",
    "jpg",
    "jpeg",
    "png",
    "doc",
    "docx",
    "pdf",
    "xls",
    "xlsx",
    "pptx",
  ];
  $(".dropFilesArea").hide();

  if (violtionPriceType == "fixed" || violtionPriceType == "store") {
    $(".payEquipmentsAttachBox").hide();
    $(".payRoyaltyAttachBox").hide();
    $(".equipmentsPriceBox").hide();
    $(".royaltyPriceBox").hide();
    $(".violationPriceBox").removeClass("col-md-4").addClass("col-md-7");
    // $(".royaltyPriceBox").removeClass("col-md-4").addClass("col-md-6")
  }
  if (
    $(".equipmentsPriceBox").is(":visible") &&
    $(".royaltyPriceBox").is(":visible")
  ) {
    $(".violationPriceBox").removeClass("col-md-7").addClass("col-md-4");
    // $(".royaltyPriceBox").removeClass("col-md-6").addClass("col-md-4")
  }

  let paymentQuarryReceipt;
  let countOfQuarryFiles;
  $("#attachQuarryPaymentReceipt").on("change", (e) => {
    paymentQuarryReceipt = $(e.currentTarget)[0].files;
    if (paymentQuarryReceipt.length > 0) {
      $(e.currentTarget)
        .parents(".fileBox")
        .siblings(".dropFilesArea")
        .show()
        .empty();
    }
    for (let i = 0; i < paymentQuarryReceipt.length; i++) {
      $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${paymentQuarryReceipt[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
    }
    $(".deleteFile").on("click", (event) => {
      let index = $(event.currentTarget).closest(".file").index();
      $(event.currentTarget).closest(".file").remove();
      let fileBuffer = new DataTransfer();
      for (let i = 0; i < paymentQuarryReceipt.length; i++) {
        if (index !== i) {
          fileBuffer.items.add(paymentQuarryReceipt[i]);
        }
      }
      paymentQuarryReceipt = fileBuffer.files;
      countOfQuarryFiles = paymentQuarryReceipt.length;
      if (countOfQuarryFiles == 0) {
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings(".dropFilesArea")
          .hide();
      }
    });
    for (let i = 0; i < paymentQuarryReceipt.length; i++) {
      let fileSplited = paymentQuarryReceipt[i].name.split(".");
      let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
      if ($.inArray(fileExt, filesExtension) == -1) {
        functions.warningAlert(
          "من فضلك أدخل الملفات بالامتدادات المسموح بها فقط",
        );
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings(".dropFilesArea")
          .hide();
        $(e.currentTarget).val("");
      }
    }
  });

  let paymentRoyaltyReceipt;
  let countOfRoyaltyFiles;
  $("#attachLawRoyaltyPaymentReceipt").on("change", (e) => {
    paymentRoyaltyReceipt = $(e.currentTarget)[0].files;
    if (paymentRoyaltyReceipt.length > 0) {
      $(e.currentTarget)
        .parents(".fileBox")
        .siblings(".dropFilesArea")
        .show()
        .empty();
    }
    for (let i = 0; i < paymentRoyaltyReceipt.length; i++) {
      $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${paymentRoyaltyReceipt[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
    }
    $(".deleteFile").on("click", (event) => {
      let index = $(event.currentTarget).closest(".file").index();
      $(event.currentTarget).closest(".file").remove();
      let fileBuffer = new DataTransfer();
      for (let i = 0; i < paymentRoyaltyReceipt.length; i++) {
        if (index !== i) {
          fileBuffer.items.add(paymentRoyaltyReceipt[i]);
        }
      }
      paymentRoyaltyReceipt = fileBuffer.files;
      countOfRoyaltyFiles = paymentRoyaltyReceipt.length;
      if (countOfRoyaltyFiles == 0) {
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings(".dropFilesArea")
          .hide();
      }
    });
    for (let i = 0; i < paymentRoyaltyReceipt.length; i++) {
      let fileSplited = paymentRoyaltyReceipt[i].name.split(".");
      let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
      if ($.inArray(fileExt, filesExtension) == -1) {
        functions.warningAlert(
          "من فضلك أدخل الملفات بالامتدادات المسموح بها فقط",
        );
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings(".dropFilesArea")
          .hide();
        $(e.currentTarget).val("");
      }
    }
  });

  let paymentEquipmentsReceipt;
  let countOfEquipmentsFiles;
  $("#attachEquipmentsPaymentReceipt").on("change", (e) => {
    paymentEquipmentsReceipt = $(e.currentTarget)[0].files;
    if (paymentEquipmentsReceipt.length > 0) {
      $(e.currentTarget)
        .parents(".fileBox")
        .siblings(".dropFilesArea")
        .show()
        .empty();
    }
    for (let i = 0; i < paymentEquipmentsReceipt.length; i++) {
      $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${paymentEquipmentsReceipt[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
    }
    $(".deleteFile").on("click", (event) => {
      let index = $(event.currentTarget).closest(".file").index();
      $(event.currentTarget).closest(".file").remove();
      let fileBuffer = new DataTransfer();
      for (let i = 0; i < paymentEquipmentsReceipt.length; i++) {
        if (index !== i) {
          fileBuffer.items.add(paymentEquipmentsReceipt[i]);
        }
      }
      paymentEquipmentsReceipt = fileBuffer.files;
      countOfEquipmentsFiles = paymentEquipmentsReceipt.length;
      if (countOfEquipmentsFiles == 0) {
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings(".dropFilesArea")
          .hide();
      }
    });
    for (let i = 0; i < paymentEquipmentsReceipt.length; i++) {
      let fileSplited = paymentEquipmentsReceipt[i].name.split(".");
      let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
      if ($.inArray(fileExt, filesExtension) == -1) {
        functions.warningAlert(
          "من فضلك أدخل الملفات بالامتدادات المسموح بها فقط",
        );
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings(".dropFilesArea")
          .hide();
        $(e.currentTarget).val("");
      }
    }
  });

  $(".payedPrice").on("keyup", (e) => {
    $(e.currentTarget).val($(e.currentTarget).val().split(",").join(""));
    $(e.currentTarget).val(
      $(e.currentTarget)
        .val()
        .replace(/\B(?=(?:\d{3})+(?!\d))/g, ","),
    );
    payedPrice = $(e.currentTarget).val();
    payedPrice = payedPrice.replace(/\,/g, "");
    payedPrice = Number(payedPrice);
  });

  $(".payedPrice").on("keypress", (e) => {
    return functions.isDecimalNumberKey(e);
  });

  // $(".payPartPrice").on("click",(e)=>{
  //     if(payedPrice != "" && NumbersRegex.test(payedPrice)){
  //         currentPrice = Number(ActualPrice + payedPrice);
  //         if(currentPrice != TotalPrice && currentPrice < TotalPrice){
  //             if(paymentQuarryReceipt != null && paymentQuarryReceipt.length>0){
  //                 request = {
  //                     Data:{
  //                         ID:taskId,
  //                         ViolationId:violationId,
  //                         ActualAmountPaid:currentPrice,
  //                     }
  //                 }
  //                 $(".overlay").addClass("active");
  //                 validatedViolations.payRequest(taskId,request,"PartPay")
  //             }else{
  //                 functions.warningAlert("من فضلك قم بإرفاق إيصال غرامة القيمة المحجرية")
  //             }
  //         }else{
  //             if(currentPrice == TotalPrice){
  //                 functions.warningAlert("إجمالي المبلغ المدفوع مطابق للمبلغ الكامل للمخالفة, من فضلك قم بتسديد وإنهاء المخالفة")
  //             }else{
  //                 functions.warningAlert("من فضلك قم بإدخال مبلغ السداد بشكل صحيح لا يتجاوز المبلغ الكامل للمخالفة")
  //             }
  //         }
  //     }else{
  //         functions.warningAlert("من فضلك قم بإدخال المبلغ المراد تسديده وبشكل صحيح")
  //     }
  // })

  $(".payAllPrice").on("click", (e) => {
    if (payedPrice !== "" && PositiveDecimalNumbers.test(payedPrice)) {
      // currentPrice = Number(ActualPrice + payedPrice);
      currentPrice = Number(payedPrice);
      if (currentPrice == TotalPrice) {
        if (TotalPrice > 0) {
          if (
            (paymentQuarryReceipt != null && paymentQuarryReceipt.length > 0) ||
            offenderType == "Equipment"
          ) {
            if (offenderType == "Quarry" || offenderType == "Equipment") {
              if (
                (violtionPriceType != "fixed" &&
                  violtionPriceType != "store" &&
                  $(".payEquipmentsAttachBox").is(":visible") &&
                  $(".payRoyaltyAttachBox").is(":visible")) ||
                offenderType == "Equipment"
              ) {
                if (
                  (paymentRoyaltyReceipt != null &&
                    paymentRoyaltyReceipt.length > 0) ||
                  offenderType == "Equipment" ||
                  lawRoyalty == 0
                ) {
                  if (
                    ($("#attachEquipmentsPaymentReceipt")[0] != null &&
                      $("#attachEquipmentsPaymentReceipt")[0].files.length >
                      0) ||
                    totalEquipmentsPrice == 0
                  ) {
                    request = {
                      Data: {
                        ID: taskId,
                        ViolationId: violationId,
                        ActualAmountPaid: currentPrice,
                        Status: "Paid",
                      },
                    };
                    $(".overlay").addClass("active");
                    validatedViolations.payRequest(
                      taskId,
                      request,
                      "FullPay",
                      offenderType,
                    );
                  } else {
                    functions.warningAlert(
                      "من فضلك قم بإرفاق إيصال غرامة المعدات",
                    );
                  }
                } else {
                  functions.warningAlert("من فضلك قم بإرفاق إيصال الإتاوة");
                }
              } else {
                request = {
                  Data: {
                    ID: taskId,
                    ViolationId: violationId,
                    ActualAmountPaid: currentPrice,
                    Status: "Paid",
                  },
                };
                $(".overlay").addClass("active");
                validatedViolations.payRequest(
                  taskId,
                  request,
                  "FullPay",
                  offenderType,
                );
              }
            } else if (offenderType == "Vehicle") {
              // if (
              //   (paymentRoyaltyReceipt != null &&
              //     paymentRoyaltyReceipt.length > 0) ||
              //   offenderType == "Equipment"
              // ) {
              if (
                (paymentRoyaltyReceipt != null &&
                  paymentRoyaltyReceipt.length > 0) ||
                lawRoyalty == 0 ||
                offenderType == "Equipment"
              ) {
                request = {
                  Data: {
                    ID: taskId,
                    ViolationId: violationId,
                    ActualAmountPaid: currentPrice,
                    Status: "Paid",
                  },
                };
                $(".overlay").addClass("active");
                validatedViolations.payRequest(
                  taskId,
                  request,
                  "FullPay",
                  offenderType,
                );
              } else {
                functions.warningAlert("من فضلك قم بإرفاق إيصال الإتاوة");
              }
            }
            // else{
            //     functions.warningAlert("من فضلك قم بإرفاق إيصال الإتاوة")
            // }
          } else {
            functions.warningAlert(
              " من فضلك قم بإرفاق إيصال غرامة المخالفة المحددة أو غرامة القيمة المحجرية",
            );
          }
        } else {
          request = {
            Data: {
              ID: taskId,
              ViolationId: violationId,
              ActualAmountPaid: currentPrice,
              Status: "Paid",
            },
          };
          $(".overlay").addClass("active");
          validatedViolations.payRequest(
            taskId,
            request,
            "FullPay",
            offenderType,
          );
          console.log("equal zero");
        }
      } else {
        functions.warningAlert(
          "المبلغ الذي أدخلته غير مطابق للمبلغ الكامل للمخالفة, من فضلك قم بإدخال المبلغ كاملاً بشكل صحيح",
        );
      }
    } else {
      functions.warningAlert(
        "من فضلك قم بإدخال المبلغ المراد تسديده وبشكل صحيح",
      );
    }
  });
};
validatedViolations.payRequest = (
  TaskId,
  request,
  PaymentType,
  offenderType,
) => {
  functions
    .requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save", {
      request,
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      validatedViolations.uploadPaymentReceiptsAttachment(
        TaskId,
        "ViolationsCycle",
        offenderType,
      );
    })
    .catch((err) => { });
};
validatedViolations.reffereViolationToCase = (
  TaskId,
  ViolationId,
  ViolationCode,
  OffenderType,
  TotalPrice,
) => {
  $(".overlay").removeClass("active");
  let popupHtml = `
        <div class="popupHeader">
            <div class="violationsCode"> 
                <p> إحالة المخالفة رقم (${ViolationCode})</p>
            </div>
        </div> 
        <div class="popupBody">
            <div class="popupForm detailsPopupForm" id="detailsPopupForm">

                <div class="formContent"> 
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="reffereViolationDate" class="customLabel">تاريخ الإحالة</label>
                                        <div class="inputIconBox">
                                            <input class="form-control customInput inputDate reffereViolationDate" id="reffereViolationDate" type="text" placeholder="MM/DD/YYYY">
                                            <i class="fa-solid fa-calendar-days"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="reffereViolationAttach" class="customLabel">إرفاق مستند</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput reffereViolationAttach form-control" id="reffereViolationAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
                                            </div>
                                        </div>
                                        <div class="dropFilesArea" id="dropFilesArea"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="formButtonsBox">
                    <div class="row">
                        <div class="col-12">
                            <div class="buttonsBox centerButtonsBox">
                                <div class="btnStyle confirmBtnGreen popupBtn reffereVioltionBtn" id="editCasePriceBtn">تأكيد</div>
                                <div class="btnStyle cancelBtn popupBtn closeReffereViolationPopup" id="closeReffereViolationPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>`;
  functions.declarePopup(
    ["generalPopupStyle", "greenPopup", "editPopup"],
    popupHtml,
  );
  let numberOfDaysBefore = functions.getViolationStartDate(3);
  functions.inputDateFormat(".inputDate", numberOfDaysBefore, "today");
  let violationRefferedDate = $(".reffereViolationDate").val();
  let filesExtension = [
    "gif",
    "svg",
    "jpg",
    "jpeg",
    "png",
    "doc",
    "docx",
    "pdf",
    "xls",
    "xlsx",
    "pptx",
  ];
  let allAttachments;
  let countOfFiles;
  $("#reffereViolationAttach").on("change", (e) => {
    allAttachments = $(e.currentTarget)[0].files;
    if (allAttachments.length > 0) {
      $(e.currentTarget)
        .parents(".fileBox")
        .siblings(".dropFilesArea")
        .show()
        .empty();
    }
    for (let i = 0; i < allAttachments.length; i++) {
      $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                  <div class="file">
                      <p class="fileName">${allAttachments[i].name}</p>
                      <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                  </div>
              `);
    }
    $(".deleteFile").on("click", (event) => {
      let index = $(event.currentTarget).closest(".file").index();
      $(event.currentTarget).closest(".file").remove();
      let fileBuffer = new DataTransfer();
      for (let i = 0; i < allAttachments.length; i++) {
        if (index !== i) {
          fileBuffer.items.add(allAttachments[i]);
        }
      }
      allAttachments = fileBuffer.files;
      countOfFiles = allAttachments.length;
      if (countOfFiles == 0) {
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings(".dropFilesArea")
          .hide();
      }
    });
    for (let i = 0; i < allAttachments.length; i++) {
      let fileSplited = allAttachments[i].name.split(".");
      let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
      if ($.inArray(fileExt, filesExtension) == -1) {
        functions.warningAlert(
          "من فضلك أدخل الملفات بالامتدادات المسموح بها فقط",
        );
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings(".dropFilesArea")
          .hide();
        $(e.currentTarget).val("");
      }
    }
  });
  $(".reffereViolationDate").on("change", (e) => {
    violationRefferedDate = $(e.currentTarget).val();
  });
  $(".reffereVioltionBtn").on("click", (e) => {
    if (violationRefferedDate != "") {
      if (allAttachments != null && allAttachments.length > 0) {
        $(".overlay").addClass("active");
        validatedViolations.reffereViolationAPIResponse(
          TaskId,
          ViolationId,
          OffenderType,
          TotalPrice,
          violationRefferedDate,
          "#reffereViolationAttach",
        );
      } else {
        functions.warningAlert("من فضلك قم بإرفاق المستند الخاص بالإحالة");
      }
    } else {
      functions.warningAlert("من فضلك قم بتحديد تاريخ الإحالة الخاص بالمخالفة");
    }
  });
};
validatedViolations.reffereViolationAPIResponse = (
  TaskId,
  ViolationId,
  OffenderType,
  TotalPrice,
  violationRefferedDate,
  attachInput,
) => {
  let DouplePrice = TotalPrice * 2 + 10000;
  let request = {
    Data: {
      ID: TaskId,
      Title: "تم إحالة الطلب",
      Status: "Reffered",
      ViolationId: ViolationId,
      TotalPriceDue: OffenderType == "Vehicle" ? DouplePrice : TotalPrice,
    },
  };
  functions
    .requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save", {
      request,
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      validatedViolations.uploadEditTaskAttachment(
        TaskId,
        "ViolationsCycle",
        attachInput,
      );
      validatedViolations.addNewCase(
        TaskId,
        ViolationId,
        violationRefferedDate,
      );
    })
    .catch((err) => { });
};
validatedViolations.violationExceedTimeStatusChange = (taskId, violationId) => {
  let request = {
    Data: {
      ID: taskId,
      Title: "تم تجاوز مدة السداد",
      Status: "Exceeded",
      ViolationId: violationId,
    },
  };
  functions
    .requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save", {
      request,
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      // validatedViolations.getValidatedViolations(1, true)
      window.location.reload();
    })
    .catch((err) => { });
};
validatedViolations.addNewCase = (
  TaskId,
  violationId,
  violationRefferedDate,
) => {
  let request = {
    Request: {
      Title: "قضية مسجلة من مخالفة",
      Status: "قيد مراجعة النيابة المختصة",
      ViolationId: violationId,
      TaskId: TaskId,
      RefferedDate: violationRefferedDate,
    },
  };
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/Save",
      request,
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      $(".overlay").removeClass("active");
      functions.sucessAlert("تم إحالة المخالفة وتسجيلها في سجل القضايا");
    })
    .catch((err) => { });
};
validatedViolations.requestNewPetition = (
  violationTaskID,
  violationID,
  violationCode,
) => {
  $(".overlay").removeClass("active");
  let popupHtml = `
        <div class="popupHeader">
            <div class="violationsCode"> 
                <p>إضافة التماس للمخالفة رقم (${violationCode})</p>
            </div>
        </div> 
        <div class="popupBody">
            <div class="popupForm detailsPopupForm" id="detailsPopupForm">

                <div class="formContent"> 
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="addPetitionComments" class="customLabel">موضوع الالتماس</label>
                                        <textarea class="form-control addPetitionComments petitionComments customTextArea" id="addPetitionComments" placeholder="أدخل سبب وموضوع تقديم الالتماس"></textarea>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="addPetitionAttach" class="customLabel">إرفاق مستند الالتماس</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput addPetitionAttach form-control" id="addPetitionAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
                                            </div>
                                        </div>
                                        <div class="dropFilesArea" id="dropFilesArea"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="formButtonsBox">
                    <div class="row">
                        <div class="col-12">   
                            <div class="buttonsBox centerButtonsBox">
                                <div class="btnStyle confirmBtnGreen popupBtn addPetitionBtn" id="addPetitionBtn">تأكيد</div>
                                <div class="btnStyle cancelBtn popupBtn closeAddPetitionPopup" id="closeAddPetitionPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>`;
  functions.declarePopup(
    ["generalPopupStyle", "greenPopup", "editPopup"],
    popupHtml,
  );
  let petitionComments = $("#addPetitionComments").val();
  let filesExtension = [
    "gif",
    "svg",
    "jpg",
    "jpeg",
    "png",
    "doc",
    "docx",
    "pdf",
    "xls",
    "xlsx",
    "pptx",
  ];
  let allAttachments;
  let countOfFiles;
  let request = {};

  $("#addPetitionAttach").on("change", (e) => {
    allAttachments = $(e.currentTarget)[0].files;
    if (allAttachments.length > 0) {
      $(e.currentTarget)
        .parents(".fileBox")
        .siblings(".dropFilesArea")
        .show()
        .empty();
    }
    for (let i = 0; i < allAttachments.length; i++) {
      $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${allAttachments[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
    }
    $(".deleteFile").on("click", (event) => {
      let index = $(event.currentTarget).closest(".file").index();
      $(event.currentTarget).closest(".file").remove();
      let fileBuffer = new DataTransfer();
      for (let i = 0; i < allAttachments.length; i++) {
        if (index !== i) {
          fileBuffer.items.add(allAttachments[i]);
        }
      }
      allAttachments = fileBuffer.files;
      countOfFiles = allAttachments.length;
      if (countOfFiles == 0) {
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings(".dropFilesArea")
          .hide();
      }
    });
    for (let i = 0; i < allAttachments.length; i++) {
      let fileSplited = allAttachments[i].name.split(".");
      let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
      if ($.inArray(fileExt, filesExtension) == -1) {
        functions.warningAlert(
          "من فضلك أدخل الملفات بالامتدادات المسموح بها فقط",
        );
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings(".dropFilesArea")
          .hide();
        $(e.currentTarget).val("");
      }
    }
  });
  $("#addPetitionComments").on("keyup", (e) => {
    petitionComments = $(e.currentTarget).val().trim();
  });
  $(".addPetitionBtn").on("click", (e) => {
    if (petitionComments != "") {
      if (allAttachments != null && allAttachments.length > 0) {
        $(".overlay").addClass("active");
        functions
          .requester(
            "_layouts/15/Uranium.Violations.SharePoint/Petitions.aspx/Save",
            {
              Request: {
                Title: "تقديم بيان الإلتماس",
                Status: "التماس قيد الإنتظار",
                ViolationId: violationID,
                Comments: petitionComments,
              },
            },
          )
          .then((response) => {
            if (response.ok) {
              return response.json();
            }
          })
          .then((data) => {
            if (data.d.Status) {
              let id = data.d.Result.Id;
              validatedViolations.addNewPetitionAttachment(id, "Petitions");
            } else {
              $(".overlay").removeClass("active");
              functions.warningAlert("حدث خطأ ما, لم بتم إضافة المخالفة");
            }
          })
          .catch((err) => {
            $(".overlay").removeClass("active");
            functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
          });
      } else {
        functions.warningAlert("من فضلك قم بإرفاق مستند الالتماس");
      }
    } else {
      functions.warningAlert("من فضلك قم بإدخال سبب وموضوع الالتماس");
    }
  });
};
validatedViolations.addNewPetitionAttachment = (petitionID, ListName) => {
  // let Data = new FormData();
  // let filesobj = {};
  // filesobj["itemId"] = petitionID;
  // filesobj["listName"] = ListName;
  //
  // for (let i = 0; i <= $(".detailsPopupForm #addPetitionAttach")[0].files.length; i++) {
  //
  //     // Data.append("file" + i, $(".detailsPopupForm #addPetitionAttach")[0].files[i]);
  //     filesobj[`file${i}`] = $(".detailsPopupForm #addPetitionAttach")[0].files[i];
  // }
  //
  // $.ajax({
  //     type: "POST",
  //     url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
  //     processData: false,
  //     contentType: "application/json; charset=utf-8",

  //     data: filesobj,
  //     success: (data) => {
  //
  //         $(".overlay").removeClass("active");
  //         functions.sucessAlert("تم تقديم الالتماس  بنجاح ");
  //     },
  //     error: (err) => {
  //         functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
  //         $(".overlay").removeClass("active");
  //
  //     },
  // });
  let Data = new FormData();
  Data.append("itemId", petitionID);
  Data.append("listName", ListName);
  for (
    let i = 0;
    i <= $(".detailsPopupForm #addPetitionAttach")[0].files.length;
    i++
  ) {
    Data.append(
      "file" + i,
      $(".detailsPopupForm #addPetitionAttach")[0].files[i],
    );
  }
  $.ajax({
    type: "POST",
    url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
    processData: false,
    contentType: false,
    data: Data,
    success: (data) => {
      $(".overlay").removeClass("active");
      functions.sucessAlert("تم تقديم الإلتماس بنجاح");
    },
    error: (err) => {
      functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
      $(".overlay").removeClass("active");
    },
  });
};

validatedViolations.uploadEditTaskAttachment = (
  TaskId,
  ListName,
  attachInput,
) => {
  let Data = new FormData();
  Data.append("itemId", TaskId);
  Data.append("listName", ListName);
  for (let i = 0; i <= $(attachInput)[0].files.length; i++) {
    Data.append("file" + i, $(attachInput)[0].files[i]);
  }
  $.ajax({
    type: "POST",
    url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
    processData: false,
    contentType: false,
    data: Data,
    success: (data) => { },
    error: (err) => { },
  });
};
validatedViolations.uploadPaymentReceiptsAttachment = (
  TaskId,
  ListName,
  offenderType,
) => {
  let Data = new FormData();
  Data.append("itemId", TaskId);
  Data.append("listName", ListName);
  let count = 0;
  let count2 = 0;

  if (offenderType !== "Equipment") {
    let i;
    for (i = 0; i < $("#attachQuarryPaymentReceipt")[0].files.length; i++) {
      Data.append("file" + i, $("#attachQuarryPaymentReceipt")[0].files[i]);
    }
    let j;
    for (
      j = i;
      count < $("#attachLawRoyaltyPaymentReceipt")[0].files.length;
      j++
    ) {
      Data.append(
        "file" + j,
        $("#attachLawRoyaltyPaymentReceipt")[0].files[count],
      );
      count++;
    }
    for (
      let k = j;
      count2 < $("#attachEquipmentsPaymentReceipt")[0].files.length;
      j++
    ) {
      Data.append(
        "file" + j,
        $("#attachEquipmentsPaymentReceipt")[0].files[count2],
      );
      count2++;
    }
  } else {
    Data.append(
      "file" + 0,
      $("#attachEquipmentsPaymentReceipt")[0].files[count2],
    );
  }

  $.ajax({
    type: "POST",
    url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
    processData: false,
    contentType: false,
    data: Data,
    success: (data) => {
      $(".overlay").removeClass("active");
      functions.sucessAlert("تم سداد المبلغ بالكامل وإنهاء المخالفة");
    },
    error: (err) => {
      functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
      $(".overlay").removeClass("active");
    },
  });
};
validatedViolations.filterViolationsLog = (e) => {
  let ViolationSectorVal = $("#violationSector")
    .children("option:selected")
    .val();
  let ViolationTypeVal = $("#TypeofViolation")
    .children("option:selected")
    .data("id");
  let ViolationStatusVal = $("#ViolationStatus")
    .children("option:selected")
    .val();
  let ViolationType;
  let ViolationSector;
  let ViolationStatus;
  let ViolationGeneralSearch = $("#violationSearch").val();

  if (
    ViolationTypeVal == "" &&
    ViolationSectorVal == "" &&
    ViolationStatusVal == "" &&
    ViolationGeneralSearch == ""
  ) {
    functions.warningAlert(
      "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث",
    );
  } else if (
    ViolationSectorVal != "0" ||
    ViolationTypeVal != "0" ||
    ViolationStatusVal != "" ||
    ViolationGeneralSearch != ""
  ) {
    $(".PreLoader").addClass("active");
    ViolationSector = Number(
      $("#violationSector").children("option:selected").val(),
    );
    ViolationType = Number(
      $("#TypeofViolation").children("option:selected").data("id"),
    );
    ViolationStatus = $("#ViolationStatus").children("option:selected").val();
    validatedViolations.getValidatedViolations(
      ViolationSector,
      ViolationType,
      ViolationStatus,
      ViolationGeneralSearch,
    );
  }
};

export default validatedViolations;
