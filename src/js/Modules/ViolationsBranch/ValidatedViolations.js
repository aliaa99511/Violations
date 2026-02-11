

import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import confirmPopup from "../../Shared/confirmationPopup";
import pagination from "../../Shared/Pagination";

let validatedViolations = {};
validatedViolations.pageIndex = 1;
validatedViolations.destroyTable = false;
validatedViolations.getValidatedViolations = (
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
  // debugger;
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
        "Cancelled"
        // "UnderPayment",
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
  let ViolationSectorVal = $("#violationSector").children("option:selected").val();
  let ViolationTypeVal = $("#TypeofViolation").children("option:selected").data("id");
  let ViolationStatusVal = $("#ViolationStatus").children("option:selected").val();
  let ViolationGeneralSearch = $("#violationSearch").val();

  let ViolationType;
  let ViolationSector;
  let ViolationStatus;

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

    // Call with correct parameters - same as PendingViolations
    validatedViolations.getValidatedViolations(
      true,  // destroyTable
      ViolationSector,
      ViolationType,
      ViolationStatus,
      ViolationGeneralSearch
    );
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

  // Call with default/reset values
  validatedViolations.getValidatedViolations(
    true,  // destroyTable
    0,     // ViolationSector = "0"
    0,     // ViolationType = "0"
    "",    // ViolationStatus = empty
    ""     // ViolationGeneralSearch = empty
  );
};
validatedViolations.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", validatedViolations.getValidatedViolations);
  pagination.activateCurrentPage();
};

/////////////////////////////////////////
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
      violationDate = functions.getFormatedDate(record.ReconciliationExpiredDate);
      let createdDate = functions.getFormatedDate(record.Created);

      if (
        moment(new Date()).format("MM-DD-YYYY") >
        moment(record.ReconciliationExpiredDate).format("MM-DD-YYYY") &&
        DateYear > 2020 &&
        TaskStatus == "Confirmed"
      ) {
        validatedViolations.violationExceedTimeStatusChange(taskId, violationId);
      }

      if (DateYear > 2020) {
        ExpiredDate = functions.getFormatedDate(record.ReconciliationExpiredDate);
      } else {
        ExpiredDate = "-";
      }

      data.push([
        `<div class="violationId" data-taskid="${record.ID}" data-violationid="${record.ViolationId}" data-taskstatus="${record.Status}" data-paymentstatus="${record.PaymentStatus}" data-violationcode="${taskViolation?.ViolationCode}" data-totalprice="${taskViolation?.TotalPriceDue}" data-enddate="${record.ReconciliationExpiredDate}" data-offendertype="${taskViolation?.OffenderType}">${taskViolation?.ViolationCode != undefined ? taskViolation?.ViolationCode : "-"}</div>`,
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
        `<div class="violationArName">${functions.getViolationArabicName(taskViolation?.OffenderType)}</div>`,
        `<div class="violationCode">${taskViolation?.OffenderType == "Vehicle" ? taskViolation?.CarNumber : taskViolation?.QuarryCode != undefined ? taskViolation?.QuarryCode : "-"}</div>`,
        `<div class="companyName">${taskViolation?.ViolatorCompany != undefined ? taskViolation?.ViolatorCompany : "-"}</div>`,
        `<div class="violationType" data-typeid="${taskViolation?.OffenderType == "Quarry" ? taskViolation?.ViolationTypes.ID : 0}">${functions.getViolationArabicName(taskViolation.OffenderType, taskViolation?.ViolationTypes?.Title)}</div>`,
        `<div class="violationZone">${taskViolation?.ViolationsZone != undefined ? taskViolation?.ViolationsZone : "-"}</div>`,
        `${validatedViolations.getViolationStatus(record.Status)}`,
        `${taskViolation?.IsPetition ? functions.getPetitionsStatus(taskViolation?.Petition?.GridData?.[0]?.Status) || "-" : "-"}`,
        `${ExpiredDate}`,
        `${createdDate}`,
      ]);
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
    "المخالفات المصدق عليها"
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
      let violationCode = jQueryRecord.find(".violationId").data("violationcode");
      let taskStatus = jQueryRecord.find(".violationId").data("taskstatus");
      let paymentStatus = jQueryRecord.find(".violationId").data("paymentstatus");
      let hiddenListBox = jQueryRecord.find(".controls").children(".hiddenListBox");
      let TotalPrice = jQueryRecord.find(".violationId").data("totalprice");
      let EndDate = jQueryRecord.find(".violationId").data("enddate");

      // Create separate buttons based on offender type
      let referralButtonHtml = '';
      if (offenderType === "Quarry") {
        referralButtonHtml = `<li><a href="#" class="reffereViolationQuarry">إحالة إلى النيابة المختصة</a></li>`;
      } else if (offenderType === "Vehicle") {
        referralButtonHtml = `<li><a href="#" class="reffereViolationVehicle">حظر عربة \\ معدة</a></li>`;
      }

      switch (taskStatus) {
        case "Confirmed": {
          jQueryRecord.find(".controls").children(".hiddenListBox").find(".controlsList").append(`
            <li><a href="#" class="printPaymentForm">طباعة نموذج السداد</a></li>
            <li><a href="#" class="payViolation">تسديد المخالفة</a></li>
            <li><a href="#" class="requestPetition">تقديم بيان التماس</a></li>
            ${referralButtonHtml}
          `);
          break;
        }
        case "UnderPayment": {
          jQueryRecord.find(".controls").children(".hiddenListBox").find(".controlsList").append(`
            <li><a href="#" class="printPaymentForm">طباعة نموذج السداد</a></li>
            <li><a href="#" class="payViolation">تسديد المخالفة</a></li>
          `);
          break;
        }
        case "Exceeded": {
          jQueryRecord.find(".controls").children(".hiddenListBox").find(".controlsList").append(`
            ${referralButtonHtml}
            <li><a href="#" class="payViolation">تسديد المخالفة</a></li>
            <li><a href="#" class="requestPetition">تقديم بيان التماس</a></li>
          `);
          break;
        }
      }

      if (violationlog.length > 4 && hiddenListBox.height() > 110 && jQueryRecord.is(":nth-last-child(-n + 4)")) {
        hiddenListBox.addClass("toTopDDL");
      }

      // Common event handlers
      jQueryRecord.find(".controls").children(".hiddenListBox").find(".itemDetails").on("click", (e) => {
        $(".overlay").addClass("active");
        validatedViolations.findViolationByID(e, violationTaskID, "Details");
      });

      jQueryRecord.find(".controls").children(".hiddenListBox").find(".printPaymentForm").on("click", (e) => {
        $(".overlay").addClass("active");
        validatedViolations.findViolationByID(e, violationTaskID, "PaymentFormPrint");
      });

      jQueryRecord.find(".controls").children(".hiddenListBox").find(".payViolation").on("click", (e) => {
        $(".overlay").addClass("active");
        validatedViolations.findViolationByID(e, violationTaskID, "PaymentForm");
      });

      jQueryRecord.find(".controls").children(".hiddenListBox").find(".requestPetition").on("click", (e) => {
        $(".overlay").addClass("active");
        validatedViolations.requestNewPetition(violationTaskID, violationID, violationCode);
      });

      jQueryRecord.find(".controls").children(".hiddenListBox").find(".killViolation").on("click", (e) => {
        $(".overlay").addClass("active");
        confirmPopup.updateTaskStatusPopup(violationTaskID, violationCode, violationID, "Kill");
      });

      jQueryRecord.find(".controls").children(".hiddenListBox").find(".editViolation").on("click", (e) => {
        $(".overlay").addClass("active");
        validatedViolations.editViolationDataPopup(violationTaskID, violationID, violationCode, TotalPrice, EndDate);
      });

      jQueryRecord.find(".controls").children(".hiddenListBox").find(".printViolationDetails").on("click", (e) => {
        validatedViolations.findViolationByID(e, violationTaskID, "Details", true);
      });

      // Separate event handlers for quarry and vehicle referral
      jQueryRecord.find(".controls").children(".hiddenListBox").find(".reffereViolationQuarry").on("click", (e) => {
        $(".overlay").addClass("active");
        validatedViolations.reffereViolationToCase(
          violationTaskID,
          violationID,
          violationCode,
          offenderType,
          TotalPrice
        );
      });

      jQueryRecord.find(".controls").children(".hiddenListBox").find(".reffereViolationVehicle").on("click", (e) => {
        $(".overlay").addClass("active");
        validatedViolations.reffereViolationToCase(
          violationTaskID,
          violationID,
          violationCode,
          offenderType,
          TotalPrice
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
                <span class="statusText">منظورة</span>
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

        console.log('violationData', violationData)
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
//////////////////////////////////////////////////

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


////////////////////////////////////////
validatedViolations.paymentFormHtml = (TaskData) => {
  console.log('TaskData', TaskData)
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
            <div class="popupForm paymentForm" id="paymentForm" 
                    data-taskid="${TaskData.ID}" 
                    data-violationid="${TaskData.ViolationId}" 
                    data-actualprice="${TaskData.Violation.ActualAmountPaid}" 
                    data-lawroyalty="${TaskData.Violation.LawRoyalty}" 
                    data-totalequipmentsprice="${TaskData.Violation.TotalEquipmentsPrice}" 
                    data-totalprice="${TaskData.Violation.TotalPriceDue}" 
                    data-offendertype="${TaskData.Violation.OffenderType}" 
                    data-violationpricetype="${offenderType == "Quarry" ? TaskData.Violation.ViolationTypes.PriceType : 0}" 
                    data-totalinstallmentspaidamount="${TaskData?.Violation?.TotalInstallmentsPaidAmount || 0}">
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
                                        <input class="form-control customInput totalPrice disabledInput" id="totalPrice" type="text" 
                                              value="${functions.splitBigNumbersByComma(
      TaskData?.Violation?.TotalPriceDue,
    )}" disabled>
                                    </div>
                                    <div class="form-group customFormGroup">
                                        <label for="reconciliationPeriod" class="customLabel">تاريخ نهاية مدة التصالح</label>
                                        <div class="inputIconBox">
                                            <input class="form-control customInput reconciliationPeriod disabledInput" id="reconciliationPeriod" type="text" 
                                                    value="${functions.getFormatedDate(
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


                                    <!----------------------------- المبلغ المتبقي -->
                                    <div class="form-group customFormGroup actualRemainigPriceBox">
                                      <label class="customLabel">المبلغ المتبقي</label>
                                      <input
                                        class="form-control customInput disabledInput remainingAmount"
                                        type="text"
                                        value="${functions.splitBigNumbersByComma(
      TaskData?.Violation?.RemainingAmount
    )}"
                                        disabled
                                      />
                                    </div>

                                    <div class="form-group customFormGroup">
                                        <div class="feildInfoBox">
                                            <label for="payedPrice" class="customLabel">المبلغ المراد تسديده *</label>
                                            <span class="metaDataSpan">بالجنيه المصري</span>
                                        </div>
                                        <input class="form-control customInput payedPrice greenCustomInput" id="payedPrice" type="text" placeholder="ادخل المبلغ المراد تسديده">
                                    </div>

                                    <!---------------------  سداد بالتقسيط-->
                                    <div class="form-group customFormGroup installmentBox">
                                      <label class="checkboxLabel">
                                        <input
                                          type="checkbox"
                                          class="installmentCheckbox"
                                          ${TaskData?.Violation?.IsInstallment ? "checked disabled" : ""}
                                        />
                                        سداد بالتقسيط
                                      </label>
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
                                    
                                    <div class="form-group customFormGroup payEquipmentsAttachBox" 
                                          style="display:${offenderType == "Quarry" ||
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
                                <div class="btnStyle confirmBtnGreen popupBtn payInstallment" style="display:none">
                                  سداد بالتقسيط
                                </div>

                                <div class="btnStyle confirmBtnGreen popupBtn payAllPrice">
                                  تسديد وإنهاء المخالفة
                                </div>                                
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
validatedViolations.paymentFormActions = () => {
  let request = {};
  let violtionPriceType = $(".paymentForm").data("violationpricetype");
  let offenderType = $(".paymentForm").data("offendertype");
  let lawRoyalty = $(".paymentForm").data("lawroyalty");
  let totalEquipmentsPrice = $(".paymentForm").data("totalequipmentsprice");
  let taskId = $(".paymentForm").data("taskid");
  let violationId = $(".paymentForm").data("violationid");
  let TotalPrice = Number($(".paymentForm").data("totalprice"));
  let ActualPrice = $(".paymentForm").data("actualprice");
  let remainingAmount = Number($(".remainingAmount").val()?.replace(/,/g, "") || 0);

  // NEW: Get the total installments paid amount from the form
  let totalInstallmentsPaidAmount = Number($(".paymentForm").data("totalinstallmentspaidamount") || 0);

  let paymentDurationMonths = 2;

  let payedPrice = 0;
  let PositiveDecimalNumbers = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;
  let NumbersRegex = /(?:^|\s)(?=.)((?:0|(?:[1-9](?:\d*|\d{0,2}(?:,\d{3})*)))?(?:\.\d*[1-9])?)(?!\S)/;
  let filesExtension = ["gif", "svg", "jpg", "jpeg", "png", "doc", "docx", "pdf", "xls", "xlsx", "pptx"];
  $(".dropFilesArea").hide();

  // UI Rules
  if ($(".installmentCheckbox").is(":checked")) {
    $(".payAllPrice").hide();
    $(".payInstallment").show();
  } else {
    $(".payAllPrice").show();
    $(".payInstallment").hide();
  }

  $(".installmentCheckbox").on("change", function () {
    if ($(this).is(":checked")) {
      $(".payAllPrice").hide();
      $(".payInstallment").show();
    } else {
      $(".payInstallment").hide();
      $(".payAllPrice").show();
    }
  });

  if (violtionPriceType == "fixed" || violtionPriceType == "store") {
    $(".payEquipmentsAttachBox").hide();
    $(".payRoyaltyAttachBox").hide();
    $(".equipmentsPriceBox").hide();
    $(".royaltyPriceBox").hide();
    $(".violationPriceBox").removeClass("col-md-4").addClass("col-md-7");
  }

  if ($(".equipmentsPriceBox").is(":visible") && $(".royaltyPriceBox").is(":visible")) {
    $(".violationPriceBox").removeClass("col-md-7").addClass("col-md-4");
  }

  // File attachment handlers (unchanged)
  let paymentQuarryReceipt;
  let countOfQuarryFiles;
  $("#attachQuarryPaymentReceipt").on("change", (e) => {
    paymentQuarryReceipt = $(e.currentTarget)[0].files;
    if (paymentQuarryReceipt.length > 0) {
      $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
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
        $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
      }
    });
    for (let i = 0; i < paymentQuarryReceipt.length; i++) {
      let fileSplited = paymentQuarryReceipt[i].name.split(".");
      let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
      if ($.inArray(fileExt, filesExtension) == -1) {
        functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط");
        $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
        $(e.currentTarget).val("");
      }
    }
  });

  let paymentRoyaltyReceipt;
  let countOfRoyaltyFiles;
  $("#attachLawRoyaltyPaymentReceipt").on("change", (e) => {
    paymentRoyaltyReceipt = $(e.currentTarget)[0].files;
    if (paymentRoyaltyReceipt.length > 0) {
      $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
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
        $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
      }
    });
    for (let i = 0; i < paymentRoyaltyReceipt.length; i++) {
      let fileSplited = paymentRoyaltyReceipt[i].name.split(".");
      let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
      if ($.inArray(fileExt, filesExtension) == -1) {
        functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط");
        $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
        $(e.currentTarget).val("");
      }
    }
  });

  let paymentEquipmentsReceipt;
  let countOfEquipmentsFiles;
  $("#attachEquipmentsPaymentReceipt").on("change", (e) => {
    paymentEquipmentsReceipt = $(e.currentTarget)[0].files;
    if (paymentEquipmentsReceipt.length > 0) {
      $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
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
        $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
      }
    });
    for (let i = 0; i < paymentEquipmentsReceipt.length; i++) {
      let fileSplited = paymentEquipmentsReceipt[i].name.split(".");
      let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
      if ($.inArray(fileExt, filesExtension) == -1) {
        functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط");
        $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
        $(e.currentTarget).val("");
      }
    }
  });

  // Input formatting
  $(".payedPrice").on("keyup", (e) => {
    $(e.currentTarget).val($(e.currentTarget).val().split(",").join(""));
    $(e.currentTarget).val($(e.currentTarget).val().replace(/\B(?=(?:\d{3})+(?!\d))/g, ","));
    payedPrice = $(e.currentTarget).val();
    payedPrice = payedPrice.replace(/\,/g, "");
    payedPrice = Number(payedPrice);
  });

  $(".payedPrice").on("keypress", (e) => {
    return functions.isDecimalNumberKey(e);
  });

  // Full Payment Logic
  $(".payAllPrice").on("click", (e) => {
    if (payedPrice !== "" && PositiveDecimalNumbers.test(payedPrice)) {
      let currentPrice = Number(payedPrice);

      if (currentPrice == TotalPrice) {
        if (TotalPrice > 0) {
          if ((paymentQuarryReceipt != null && paymentQuarryReceipt.length > 0) || offenderType == "Equipment") {
            if (offenderType == "Quarry" || offenderType == "Equipment") {
              if ((violtionPriceType != "fixed" && violtionPriceType != "store" && $(".payEquipmentsAttachBox").is(":visible") && $(".payRoyaltyAttachBox").is(":visible")) || offenderType == "Equipment") {
                if ((paymentRoyaltyReceipt != null && paymentRoyaltyReceipt.length > 0) || offenderType == "Equipment" || lawRoyalty == 0) {
                  if (($("#attachEquipmentsPaymentReceipt")[0] != null && $("#attachEquipmentsPaymentReceipt")[0].files.length > 0) || totalEquipmentsPrice == 0) {
                    request = {
                      Data: {
                        ID: taskId,
                        ViolationId: violationId,
                        ActualAmountPaid: currentPrice,
                        Status: "Paid",
                      },
                    };
                    $(".overlay").addClass("active");
                    validatedViolations.payRequest(taskId, request, "FullPay", offenderType);
                  } else {
                    functions.warningAlert("من فضلك قم بإرفاق إيصال غرامة المعدات");
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
                validatedViolations.payRequest(taskId, request, "FullPay", offenderType);
              }
            } else if (offenderType == "Vehicle") {
              if ((paymentRoyaltyReceipt != null && paymentRoyaltyReceipt.length > 0) || lawRoyalty == 0 || offenderType == "Equipment") {
                request = {
                  Data: {
                    ID: taskId,
                    ViolationId: violationId,
                    ActualAmountPaid: currentPrice,
                    Status: "Paid",
                  },
                };
                $(".overlay").addClass("active");
                validatedViolations.payRequest(taskId, request, "FullPay", offenderType);
              } else {
                functions.warningAlert("من فضلك قم بإرفاق إيصال الإتاوة");
              }
            }
          } else {
            functions.warningAlert("من فضلك قم بإرفاق إيصال غرامة المخالفة المحددة أو غرامة القيمة المحجرية");
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
          validatedViolations.payRequest(taskId, request, "FullPay", offenderType);
        }
      } else {
        functions.warningAlert("المبلغ الذي أدخلته غير مطابق للمبلغ الكامل للمخالفة, من فضلك قم بإدخال المبلغ كاملاً بشكل صحيح");
      }
    } else {
      functions.warningAlert("من فضلك قم بإدخال المبلغ المراد تسديده وبشكل صحيح");
    }
  });

  // Installment Payment Logic
  $(".payInstallment").on("click", () => {
    if (!payedPrice || payedPrice <= 0) {
      functions.warningAlert("من فضلك أدخل مبلغ صحيح");
      return;
    }

    if (payedPrice > remainingAmount) {
      functions.warningAlert("المبلغ المدخل أكبر من المبلغ المتبقي");
      return;
    }

    // File attachment validation for installment
    if (TotalPrice > 0) {
      if ((paymentQuarryReceipt != null && paymentQuarryReceipt.length > 0) || offenderType == "Equipment") {
        if (offenderType == "Quarry" || offenderType == "Equipment") {
          if ((violtionPriceType != "fixed" && violtionPriceType != "store" && $(".payEquipmentsAttachBox").is(":visible") && $(".payRoyaltyAttachBox").is(":visible")) || offenderType == "Equipment") {
            if ((paymentRoyaltyReceipt != null && paymentRoyaltyReceipt.length > 0) || offenderType == "Equipment" || lawRoyalty == 0) {
              if (($("#attachEquipmentsPaymentReceipt")[0] != null && $("#attachEquipmentsPaymentReceipt")[0].files.length > 0) || totalEquipmentsPrice == 0) {
                // Validation passed, proceed with installment payment
              } else {
                functions.warningAlert("من فضلك قم بإرفاق إيصال غرامة المعدات");
                return;
              }
            } else {
              functions.warningAlert("من فضلك قم بإرفاق إيصال الإتاوة");
              return;
            }
          }
        } else if (offenderType == "Vehicle") {
          if ((paymentRoyaltyReceipt != null && paymentRoyaltyReceipt.length > 0) || lawRoyalty == 0 || offenderType == "Equipment") {
            // Validation passed, proceed with installment payment
          } else {
            functions.warningAlert("من فضلك قم بإرفاق إيصال الإتاوة");
            return;
          }
        }
      } else {
        functions.warningAlert("من فضلك قم بإرفاق إيصال غرامة المخالفة المحددة أو غرامة القيمة المحجرية");
        return;
      }
    }

    let newRemainingAmount = remainingAmount - payedPrice;
    let isLastInstallment = newRemainingAmount === 0;

    // Calculate new total installments paid amount
    let newTotalInstallmentsPaidAmount = totalInstallmentsPaidAmount + payedPrice;

    let request = {
      Data: {
        ID: taskId,
        ViolationId: violationId,
        ActualAmountPaid: payedPrice,
        Status: isLastInstallment ? "Paid" : "UnderPayment",
        Violation: {
          IsInstallment: true,
          InstallmentAmount: payedPrice,
          RemainingAmount: newRemainingAmount,
          PaymentDurationMonths: paymentDurationMonths,
          TotalInstallmentsPaidAmount: newTotalInstallmentsPaidAmount,
          ...(isLastInstallment && {
            IsLastInstallment: true,
          })
        }
      }
    };

    $(".overlay").addClass("active");
    validatedViolations.payRequest(taskId, request, "InstallmentPay", offenderType);
  });
};
validatedViolations.payRequest = (
  TaskId,
  request,
  PaymentType,
  offenderType,
) => {
  // Store the request data in the form element
  $(".paymentForm").data("lastRequest", request);

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

//////////////////////////////////////////////////////
validatedViolations.reffereViolationToCase = (
  TaskId,
  ViolationId,
  ViolationCode,
  OffenderType,
  TotalPrice,
) => {
  $(".overlay").removeClass("active");

  // Determine popup title and input label based on offender type
  let popupTitle = '';
  let inputLabel = '';
  let inputPlaceholder = '';

  if (OffenderType === "Quarry") {
    popupTitle = `إحالة المحجر رقم (${ViolationCode}) إلى النيابة المختصة`;
    inputLabel = 'رقم الإحالة';
    inputPlaceholder = 'ادخل رقم الإحالة';
  } else if (OffenderType === "Vehicle") {
    popupTitle = `حظر العربة/المعدة رقم (${ViolationCode})`;
    inputLabel = 'رقم القيد';
    inputPlaceholder = 'ادخل رقم القيد';
  } else {
    popupTitle = `إحالة المخالفة رقم (${ViolationCode})`;
    inputLabel = 'رقم الإحالة';
    inputPlaceholder = 'ادخل رقم الإحالة';
  }

  let popupHtml = `
    <div class="popupHeader">
      <div class="violationsCode"> 
        <p>${popupTitle}</p>
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
                    <label for="reffereViolationNumber" class="customLabel">${inputLabel}</label>
                    <div class="selectBox smallSelectBox">
                      <input id="reffereViolationNumber" type="text" class="form-control customInput reffereViolationNumber" placeholder="${inputPlaceholder}" />
                    </div>
                  </div>
                </div>
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
                    <label for="reffereViolationComments" class="customLabel">الملاحظات</label>
                    <textarea class="form-control customTextArea reffereViolationComments" id="reffereViolationComments" rows="3" placeholder="أدخل الملاحظات"></textarea>
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

  functions.declarePopup(["generalPopupStyle", "greenPopup", "editPopup"], popupHtml);
  let numberOfDaysBefore = functions.getViolationStartDate(3);
  functions.inputDateFormat(".inputDate", numberOfDaysBefore, "today");

  // The rest of the function remains the same...
  let violationRefferedDate = $(".reffereViolationDate").val();
  let violationRefferedNumber = $(".reffereViolationNumber").val();
  let violationRefferedComments = $(".reffereViolationComments").val();

  let filesExtension = ["gif", "svg", "jpg", "jpeg", "png", "doc", "docx", "pdf", "xls", "xlsx", "pptx"];
  let allAttachments;
  let countOfFiles;

  $("#reffereViolationAttach").on("change", (e) => {
    allAttachments = $(e.currentTarget)[0].files;
    if (allAttachments.length > 0) {
      $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
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
        $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
      }
    });
    for (let i = 0; i < allAttachments.length; i++) {
      let fileSplited = allAttachments[i].name.split(".");
      let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
      if ($.inArray(fileExt, filesExtension) == -1) {
        functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط");
        $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
        $(e.currentTarget).val("");
      }
    }
  });

  $(".reffereViolationDate").on("change", (e) => {
    violationRefferedDate = $(e.currentTarget).val();
  });

  $(".reffereViolationNumber").on("keyup", (e) => {
    violationRefferedNumber = $(e.currentTarget).val().trim();
  });

  $(".reffereViolationComments").on("keyup", (e) => {
    violationRefferedComments = $(e.currentTarget).val().trim();
  });

  $(".reffereVioltionBtn").on("click", (e) => {
    if (violationRefferedDate != "") {
      if (violationRefferedNumber != "") {
        if (allAttachments != null && allAttachments.length > 0) {
          $(".overlay").addClass("active");
          validatedViolations.reffereViolationAPIResponse(
            TaskId,
            ViolationId,
            OffenderType,
            TotalPrice,
            violationRefferedDate,
            violationRefferedNumber,
            violationRefferedComments,
            "#reffereViolationAttach",
          );
        } else {
          functions.warningAlert("من فضلك قم بإرفاق المستند الخاص بالإحالة");
        }
      } else {
        // Update alert message based on OffenderType
        if (OffenderType === "Vehicle") {
          functions.warningAlert("من فضلك قم بإدخال رقم القيد");
        } else {
          functions.warningAlert("من فضلك قم بإدخال رقم الإحالة");
        }
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
  ReferralNumber,
  Comments = "",
  attachInput,
) => {
  let DouplePrice = TotalPrice * 2 + 10000;
  let request = {
    Data: {
      ID: TaskId,
      Title: OffenderType == "Vehicle" ? "تم حظر عربة - معدة" : " تم إحالة الطلب للنيابة المختصة",
      Status: "UnderReview",
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
      // First upload task attachment
      validatedViolations.uploadEditTaskAttachment(
        TaskId,
        "ViolationsCycle",
        attachInput,
      );

      // Then add new case with appropriate payload based on offender type
      validatedViolations.addNewCase(
        TaskId,
        ViolationId,
        violationRefferedDate,
        ReferralNumber,
        Comments,
        OffenderType,
      );
    })
    .catch((err) => { });
};

validatedViolations.addNewCase = (
  TaskId,
  violationId,
  violationRefferedDate,
  ReferralNumber,
  Comments = "",
  OffenderType,
) => {
  // Determine payload based on offender type
  let request;

  if (OffenderType === "Quarry") {
    request = {
      Request: {
        Title: "إحالة محجر إلى النيابة",
        Status: "قيد الانتظار القطاع",
        ViolationId: violationId,
        TaskId: TaskId,
        ReferralNumber: ReferralNumber,
        RefferedDate: violationRefferedDate,
        Comments: Comments,
        OffenderType: OffenderType
      },
    };
  } else if (OffenderType === "Vehicle") {
    request = {
      Request: {
        Title: "تم حظر عربة او معدة",
        Status: "قيد انتظار الرقم القضائي",
        ViolationId: violationId,
        TaskId: TaskId,
        VehicleRegistrationNumber: ReferralNumber, // Use VehicleRegistrationNumber for vehicles
        RefferedDate: violationRefferedDate,
        Comments: Comments,
        OffenderType: OffenderType
      },
    };
  } else {
    // Default case for other offender types
    request = {
      Request: {
        Title: "قضية مسجلة من مخالفة",
        Status: "قيد مراجعة النيابة المختصة",
        ViolationId: violationId,
        TaskId: TaskId,
        ReferralNumber: ReferralNumber,
        RefferedDate: violationRefferedDate,
        Comments: Comments
      },
    };
  }

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
      if (data.d.Status) {
        // Get the Case ID from response
        let CaseId = data.d.Result?.Id;
        if (CaseId) {
          // Add attachment record for the case (like in violationsCases)
          validatedViolations.addNewCaseAttachmentRecord(
            CaseId,
            "إحالة إلى النيابة",
            "#reffereViolationAttach",
            "تم إحالة المخالفة وتسجيلها في سجل القضايا بنجاح",
            Comments
          );
        } else {
          $(".overlay").removeClass("active");
          functions.sucessAlert("تم إحالة المخالفة وتسجيلها في سجل القضايا");
        }
      } else {
        $(".overlay").removeClass("active");
        functions.warningAlert("حدث خطأ أثناء حفظ القضية");
      }
    })
    .catch((err) => {
      $(".overlay").removeClass("active");
      functions.warningAlert("حدث خطأ في الاتصال بالخادم");
    });
};
validatedViolations.addNewCaseAttachmentRecord = (
  CaseId,
  uploadPhase,
  attachInput,
  Message = "",
  Comments = ""
) => {
  let request = {
    Request: {
      Title: "New Attachment Record",
      CaseId: CaseId,
      UploadPhase: uploadPhase,
      Comments: Comments,
    },
  };

  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/CaseAttachments.aspx/Save",
      request
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      if (data.d.Status) {
        let RecordId = data.d.Result.Id;
        validatedViolations.uploadCaseAttachments(
          RecordId,
          attachInput,
          "CasesAttachments",
          Message
        );
      } else {
        $(".overlay").removeClass("active");
        functions.warningAlert("هناك خطأ في إرسال بيانات الطلب");
      }
    })
    .catch((err) => {
      $(".overlay").removeClass("active");
      functions.warningAlert("حدث خطأ في الاتصال بالخادم");
    });
};
validatedViolations.uploadCaseAttachments = (
  RecordId,
  attachInput,
  ListName,
  Message
) => {
  let Data = new FormData();
  Data.append("itemId", RecordId);
  Data.append("listName", ListName);

  // Get all files from the input
  let files = $(attachInput)[0].files;
  for (let i = 0; i < files.length; i++) {
    Data.append("file" + i, files[i]);
  }

  $.ajax({
    type: "POST",
    url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
    processData: false,
    contentType: false,
    data: Data,
    success: (data) => {
      $(".overlay").removeClass("active");
      functions.sucessAlert(Message);
    },
    error: (err) => {
      functions.warningAlert("خطأ في إرسال المرفقات لقاعدة البيانات");
      $(".overlay").removeClass("active");
    },
  });
};
//////////////////////////////////////////////////////

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

  let files = $(attachInput)[0].files;
  for (let i = 0; i < files.length; i++) {
    Data.append("file" + i, files[i]);
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

      // Get the status from the request that was stored in the form
      let requestData = $(".paymentForm").data("lastRequest") || {};
      let status = requestData?.Data?.Status || "Paid";
      let isInstallment = requestData?.Data?.Violation?.IsInstallment || false;

      if (status === "UnderPayment") {
        functions.sucessAlert("تم تسديد القسط بنجاح");
      } else if (status === "Paid") {
        if (isInstallment) {
          functions.sucessAlert("تم سداد آخر قسط وإنهاء المخالفة");
        } else {
          functions.sucessAlert("تم سداد المبلغ بالكامل وإنهاء المخالفة");
        }
      }
    },
    error: (err) => {
      functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
      $(".overlay").removeClass("active");
    },
  });
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

export default validatedViolations;

