import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import confirmPopup from "../../Shared/confirmationPopup";
import pagination from "../../Shared/Pagination";

let validatedViolations = {};
validatedViolations.pageIndex = 1;

validatedViolations.getValidatedViolations = (
  pageIndex = 1,
  destroyTable = false,
  ViolationZone = "",
  ViolationType = 0,
  PaymentStatus = ""
) => {
  let ShownRows = 10;
  let request = {
    Data: {
      RowsPerPage: ShownRows,
      PageIndex: Number(pageIndex),
      ColName: "created",
      SortOrder: "desc",
      Status: "Confirmed",
      PaymentStatus: PaymentStatus,
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
      console.log(data);
      $(".PreLoader").removeClass("active");
      let ValidatedViolation = [];
      let ItemsData = data.d.Result;
      console.log("ItemsData", ItemsData);
      if (data.d.Result.GridData != null) {
        if (data.d.Result.GridData.length > 0) {
          Array.from(data.d.Result.GridData).forEach((element) => {
            ValidatedViolation.push(element);
          });
        } else {
          ValidatedViolation = [];
        }
      }
      validatedViolations.setPaginations(ItemsData.TotalPageCount, ShownRows);
      validatedViolations.ValidatedViolationTable(
        ValidatedViolation,
        destroyTable
      );
      validatedViolations.pageIndex = ItemsData.CurrentPage;
    })
    .catch((err) => {
      console.log(err);
    });
};

validatedViolations.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", validatedViolations.getValidatedViolations);
  // pagination.reset()
  // pagination.scrollToElement(el, length)
  pagination.activateCurrentPage();
};

validatedViolations.ValidatedViolationTable = (
  ValidatedViolation,
  destroyTable
) => {
  let data = [];
  let taskViolation;
  let TaskStatus;
  // let TaskData;

  if (ValidatedViolation.length > 0) {
    ValidatedViolation.forEach((record) => {
      // TaskData=record;
      taskViolation = record.Violation;
      TaskStatus = record.Status;
      if (
        TaskStatus == "Confirmed" ||
        TaskStatus == "Reffered" ||
        TaskStatus == "Paid"
      ) {
        data.push([
          `<div class="violationId" data-taskid="${record.ID}" data-violationid="${record.ViolationId}" data-taskstatus="${record.Status}" data-paymentstatus="${record.PaymentStatus}" data-violationcode="${taskViolation.ViolationCode}" data-totalprice="${taskViolation.TotalPriceDue}" data-enddate="${record.ReconciliationExpiredDate}" data-offendertype="${taskViolation.OffenderType}">${taskViolation.ViolationCode}</div>`,
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
          `${validatedViolations.getPaymentStatus(record.PaymentStatus)}`,
          `${functions.getFormatedDate(record.ReconciliationExpiredDate)}`,
          `<div class='controls'>
                        <div class='ellipsisButton'>
                            <i class='fa-solid fa-ellipsis-vertical'></i>
                        </div>
                        <div class="hiddenListBox">
                            <div class='arrow'></div>
                            <ul class='list-unstyled controlsList'>
                                <li><a href="#" class="itemDetails">المزيد من التفاصيل</a></li>
                                <li><a href="#" class="printViolationDetails">طباعة التقرير</a></li>
                            </ul>
                        </div>
                    </div`,
        ]);
      }
    });
  }
  let Table = functions.tableDeclare(
    "#ValidatedViolation",
    data,
    [
      { title: "رقم المخالفة" },
      { title: "تصنيف المخالفة" },
      { title: "رقم المحجر/العربة" },
      { title: "إسم الشركة المخالفة" },
      { title: "نوع المخالفة " },
      { title: "المنطقة", visible: true },
      { title: "حالة المخالفة" },
      { title: "الحد الأقصى للمصالحة" },
      { title: "", class: "all" },
    ],
    false,
    destroyTable
  );
  $(".ellipsisButton").on("click", (e) => {
    $(".hiddenListBox").hide(300);
    $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
  });
  let UserId = _spPageContextInfo.userId;
  let violationlog = Table.rows().nodes().to$();
  functions.callSharePointListApi("Configurations").then((Users) => {
    let UserDetails;
    let UsersData = Users.value;
    UsersData.forEach((User) => {
      if (User.UserIdId == UserId && User.JobTitle1 == "فرع المخالفات") {
        UserDetails = User;
      }
    });
    $.each(violationlog, (index, record) => {
      let jQueryRecord = $(record);
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
      let OffenderType = jQueryRecord.find(".violationId").data("offendertype");

      if (UserDetails.Permissions == "Full") {
        switch (paymentStatus) {
          case "قيد الإنتظار": {
            jQueryRecord
              .find(".controls")
              .children(".hiddenListBox")
              .find(".controlsList").append(`
                            <li><a href="#" class="printPaymentForm">طباعة نموذج السداد</a></li>
                            <li><a href="#" class="payViolation">تسديد المخالفة</a></li>
                            <li><a href="#" class="editViolation">تعديل المخالفة</a></li>
                            <li><a href="#" class="requestPetition">تقديم بيان التماس</a></li>
                        `);
            break;
          }
          case "تجاوز مدة السداد": {
            jQueryRecord
              .find(".controls")
              .children(".hiddenListBox")
              .find(".controlsList").append(`
                            <li><a href="#" class="reffereViolation">إحالة لإدارة المدعي العام العسكري</a></li>
                            <li><a href="#" class="payViolation">تسديد المخالفة</a></li>
                            <li><a href="#" class="requestPetition">تقديم بيان التماس</a></li>
                        `);
            break;
          }
          case "تم الإحالة": {
            jQueryRecord
              .find(".controls")
              .children(".hiddenListBox")
              .find(".controlsList").append(`
                            <li><a href="#" class="payViolation">تسديد المخالفة</a></li>
                            <li><a href="#" class="killViolation">إعدام المخالفة</a></li>
                        `);
            break;
          }
        }
      }
      if (
        violationlog.length > 4 &&
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
            "PaymentFormPrint"
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
            "PaymentForm"
          );
        });
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".reffereViolation")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          confirmPopup.updateTaskStatusPopup(
            violationTaskID,
            violationCode,
            "Reffer"
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
            "Kill"
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
            EndDate
          );
        });
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".printViolationDetails")
        .on("click", (e) => {
          // let Content;
          // let printBox;
          // if(OffenderType == "Quarry"){
          //     Content = DetailsPopup.quarryDetailsPopupContent(taskViolation,"المصدق عليها");
          //     printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          //     functions.declarePopup(["generalPopupStyle", "detailsPopup"],printBox);
          // }else{
          //     Content = DetailsPopup.vehicleDetailsPopupContent(taskViolation,"المصدق عليها");
          //     printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          //     functions.declarePopup(["generalPopupStyle", "detailsPopup"],printBox);
          // }
          validatedViolations.findViolationByID(
            e,
            violationTaskID,
            "Details",
            true
          );
          $(".confirmationAttachBox").show();
          DetailsPopup.getConfirmationAttachments(violationTaskID);
          functions.PrintDetails(e);
        });
    });
  });
  functions.hideTargetElement(".controls", ".hiddenListBox");
};

validatedViolations.getPaymentStatus = (PaymentStatus) => {
  let statusHtml = ``;
  switch (PaymentStatus) {
    case "قيد الإنتظار": {
      statusHtml = `<div class="paymentStatus pendingStatus">
                <i class="paymentIcon fa-regular fa-clock"></i>
                <span>${PaymentStatus}</span>
            </div>`;
      break;
    }
    case "تجاوز مدة السداد": {
      statusHtml = `<div class="paymentStatus warningStatus">
                <img class="paymentIcon" src="/Style Library/MiningViolations/images/tringleIcon.svg" alt="warning">
                <span>${PaymentStatus}</span>
            </div>`;
      break;
    }
    case "معدومة": {
      statusHtml = `<div class="paymentStatus killedStatus">
                <i class="fa-solid fa-trash"></i>
                <span>${PaymentStatus}</span>
            </div>`;
      break;
    }
    case "تم الإحالة": {
      statusHtml = `<div class="paymentStatus refferedStatus">
                <i class="paymentIcon fa-sharp fa-regular fa-circle-xmark"></i>
                <span>${PaymentStatus}</span>
            </div>`;
      break;
    }
    case "تم السداد":
    case "تم التصالح": {
      statusHtml = `<div class="paymentStatus closedStatus">
                <i class="paymentIcon fa-regular fa-circle-check"></i>
                <span>${PaymentStatus}</span>
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
  print = false
) => {
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
      let violationData,
        violationOffenderType,
        Content,
        TaskId,
        paymentForm,
        TaskData,
        printBox,
        ExDate;
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
          paymentForm = validatedViolations.paymentFormHtml(TaskData);
          if (popupType == "PaymentForm") {
            Content += paymentForm;
            printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          }
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup"],
            printBox
          );
        } else {
          Content = DetailsPopup.vehicleDetailsPopupContent(
            violationData,
            "المصدق عليها"
          );
          paymentForm = validatedViolations.paymentFormHtml(TaskData);
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          if (popupType == "PaymentForm") {
            Content += paymentForm;
            printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          }
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
        validatedViolations.popupPermissionShowTypes(popupType, TaskId, ExDate);
        validatedViolations.paymentFormActions();
        $(".printBtn").on("click", (e) => {
          functions.PrintDetails(e);
        });
        $(".printPaymentForm").on("click", (e) => {
          functions.PrintDetails(e);
        });
        if (print) {
          functions.PrintDetails(event);
        }
      } else {
        violationData = null;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};
validatedViolations.popupPermissionShowTypes = (popupType, TaskId, ExDate) => {
  console.log(ExDate);
  if (popupType == "Details") {
    $(".totalPriceBox").show().find(".violationEndTime").val(ExDate);
    $(".confirmationAttachBox").show();
    DetailsPopup.getConfirmationAttachments(TaskId);
  } else if (popupType == "PaymentFormPrint") {
    $(".totalPriceBox").show().find(".violationEndTime").val(ExDate);
    $(".printPaymentForm").css("display", "flex");
  } else if (popupType == "PaymentForm") {
    $(".totalPriceBox").show().find(".violationEndTime").val(ExDate);
    $(".popupFormBoxHeader").show();
    $(".confirmationAttachBox").show();
    DetailsPopup.getConfirmationAttachments(TaskId);
    // $(".formButtonsBox").hide()
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
            : "إظهار المزيد من التفاصيل"
        );
    });
  }
};

validatedViolations.paymentFormHtml = (TaskData) => {
  let paymentFormHtml = `
        <div class="paymentFormBody">
            <div class="popupForm paymentForm" id="paymentForm" data-taskid="${
              TaskData.ID
            }" data-violationid="${TaskData.ViolationId}" data-actualprice="${
    TaskData.Violation.ActualAmountPaid
  }" data-totalprice="${TaskData.Violation.TotalPriceDue}">
                <div class="formContent">
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="totalPrice" class="customLabel">المبلغ المطلوب تسديده كامل</label>
                                        <input class="form-control customInput totalPrice disabledInput" id="totalPrice" type="text" value="${functions.splitBigNumbersByComma(
                                          TaskData.Violation.TotalPriceDue
                                        )}" disabled>
                                    </div>
                                    <div class="form-group customFormGroup actualPayedPriceBox">
                                        <label for="actualPricePayed" class="customLabel">المبلغ المدفوع</label>
                                        <input class="form-control customInput actualPricePayed disabledInput" id="actualPricePayed" type="text" value="${functions.splitBigNumbersByComma(
                                          TaskData.Violation.ActualAmountPaid
                                        )}" disabled>
                                    </div>
                                    <div class="form-group customFormGroup actualRemainigPriceBox">
                                        <label for="actualPriceRemainig" class="customLabel">المبلغ المتبقي</label>
                                        <input class="form-control customInput actualPriceRemainig disabledInput" id="actualPriceRemainig" type="text" value="${functions.splitBigNumbersByComma(
                                          TaskData.Violation.TotalPriceDue -
                                            TaskData.Violation.ActualAmountPaid
                                        )}" disabled>
                                    </div>
                                    <div class="form-group customFormGroup">
                                        <label for="reconciliationPeriod" class="customLabel">تاريخ نهاية مدة التصالح</label>
                                        <div class="inputIconBox">
                                            <input class="form-control customInput reconciliationPeriod disabledInput" id="reconciliationPeriod" type="text" value="${functions.getFormatedDate(
                                              TaskData.ReconciliationExpiredDate
                                            )}" disabled>
                                            <i class="fa-solid fa-calendar-days"></i>
                                        </div>
                                    </div>
                                    <div class="form-group customFormGroup">
                                        <div class="feildInfoBox">
                                            <label for="payedPrice" class="customLabel">المبلغ المراد تسديده *</label>
                                            <span>بالجنيه المصري</span>
                                        </div>
                                        <input class="form-control customInput payedPrice" id="payedPrice" type="text" placeholder="ادخل المبلغ المراد تسديده">
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="attachPaymentReceipt" class="customLabel">إرفاق تقرير مصور</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput attachPaymentReceipt form-control" id="attachPaymentReceipt" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx">
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
                                <div class="btnStyle cancelBtn popupBtn payPartPrice" id="payPartPrice">تسديد جزء من المخالفة</div>
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
validatedViolations.paymentFormActions = () => {
  let request = {};
  let taskId = $(".paymentForm").data("taskid");
  let violationId = $(".paymentForm").data("violationid");
  let TotalPrice = $(".paymentForm").data("totalprice");
  let ActualPrice = $(".paymentForm").data("actualprice");
  // let payedPrice = $(".payedPrice").val()
  let payedPrice = $(".payedPrice").val();
  let currentPrice;
  let NumbersRegex =
    /(?:^|\s)(?=.)((?:0|(?:[1-9](?:\d*|\d{0,2}(?:,\d{3})*)))?(?:\.\d*[1-9])?)(?!\S)/;
  let paymentReceipt;
  let countOfFiles;
  $(".dropFilesArea").hide();
  $(".attachPaymentReceipt").on("change", (e) => {
    paymentReceipt = $(e.currentTarget)[0].files;
    if (paymentReceipt.length > 0) {
      $(".dropFilesArea").show().empty();
    }
    for (let i = 0; i < paymentReceipt.length; i++) {
      $(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${paymentReceipt[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
    }
    $(".deleteFile").on("click", (e) => {
      let index = $(e.currentTarget).closest(".file").index();
      $(e.currentTarget).closest(".file").remove();
      let fileBuffer = new DataTransfer();
      for (let i = 0; i < paymentReceipt.length; i++) {
        if (index !== i) {
          fileBuffer.items.add(paymentReceipt[i]);
        }
      }
      paymentReceipt = fileBuffer.files;
      countOfFiles = paymentReceipt.length;
      if (countOfFiles == 0) {
        $(".dropFilesArea").hide();
      }
    });
  });

  // if(ActualPrice != 0){
  //     $(".actualRemainigPriceBox").show()
  //     $(".actualPayedPriceBox").show()
  // }
  $(".payedPrice").on("keyup", (e) => {
    $(e.currentTarget).val($(e.currentTarget).val().split(",").join(""));
    $(e.currentTarget).val(
      $(e.currentTarget)
        .val()
        .replace(/\B(?=(?:\d{3})+(?!\d))/g, ",")
    );
    payedPrice = $(e.currentTarget).val();
    payedPrice = payedPrice.replace(/\,/g, "");
    payedPrice = Number(payedPrice);
  });

  $(".payedPrice").on("keypress", (e) => {
    return functions.isNumberKey(e);
  });

  $(".payPartPrice").on("click", (e) => {
    if (payedPrice != "" && NumbersRegex.test(payedPrice)) {
      currentPrice = Number(ActualPrice + payedPrice);
      if (currentPrice != TotalPrice && currentPrice < TotalPrice) {
        if (paymentReceipt != null && paymentReceipt.length > 0) {
          request = {
            Data: {
              ID: taskId,
              ViolationId: violationId,
              ActualAmountPaid: currentPrice,
            },
          };
          $(".overlay").addClass("active");
          validatedViolations.payRequest(taskId, request, "PartPay");
        } else {
          functions.warningAlert("من فضلك قم بإرفاق إيصال السداد");
        }
      } else {
        if (currentPrice == TotalPrice) {
          functions.warningAlert(
            "إجمالي المبلغ المدفوع مطابق للمبلغ الكامل للمخالفة, من فضلك قم بتسديد وإنهاء المخالفة"
          );
        } else {
          functions.warningAlert(
            "من فضلك قم بإدخال مبلغ السداد بشكل صحيح لا يتجاوز المبلغ الكامل للمخالفة"
          );
        }
      }
    } else {
      functions.warningAlert(
        "من فضلك قم بإدخال المبلغ المراد تسديده وبشكل صحيح"
      );
    }
  });

  $(".payAllPrice").on("click", (e) => {
    if (payedPrice != "" && NumbersRegex.test(payedPrice)) {
      currentPrice = Number(ActualPrice + payedPrice);
      if (currentPrice == TotalPrice) {
        if (paymentReceipt != null && paymentReceipt.length > 0) {
          console.log("ok total is accepted");
          request = {
            Data: {
              ID: taskId,
              ViolationId: violationId,
              ActualAmountPaid: currentPrice,
              Status: "Paid",
              PaymentStatus: "تم السداد",
            },
          };
          $(".overlay").addClass("active");
          validatedViolations.payRequest(taskId, request, "FullPay");
        } else {
          functions.warningAlert("من فضلك قم بإرفاق إيصال السداد");
        }
      } else {
        functions.warningAlert(
          "المبلغ الذي أدخلته غير مطابق للمبلغ الكامل للمخالفة, من فضلك قم بإدخال المبلغ كاملاً بشكل صحيح"
        );
      }
    } else {
      functions.warningAlert(
        "من فضلك قم بإدخال المبلغ المراد تسديده وبشكل صحيح"
      );
    }
  });
};
validatedViolations.payRequest = (TaskId, request, PaymentType) => {
  console.log(request);
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
      console.log(data);
      validatedViolations.uploadTaskAttachment(
        TaskId,
        "ViolationsCycle",
        "#attachPaymentReceipt",
        PaymentType
      );
    })
    .catch((err) => {
      console.log(err);
    });
};

validatedViolations.editViolationDataPopup = (
  TaskId,
  violationID,
  violationCode,
  TotalPrice,
  EndDate
) => {
  $(".overlay").removeClass("active");
  let popupHtml = `
        <div class="popupHeader">
            <div class="violationsCode"> 
                <p> كود المخالفة رقم ${violationCode}</p>
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
                                        <label for="editPrice" class="customLabel">تعديل المبلغ</label>
                                        <input class="form-control customInput editPrice" id="editPrice" type="text" value="${functions.splitBigNumbersByComma(
                                          TotalPrice
                                        )}" placeholder="أدخل إجمالي مبلغ المخالفة">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="editDate" class="customLabel">تعديل تاريخ السداد</label>
                                        <div class="inputIconBox">
                                            <input class="form-control customInput inputDate editDate" id="editDate" type="text" value="${functions.getFormatedDate(
                                              EndDate
                                            )}" placeholder="MM-DD-YYYY">
                                            <i class="fa-solid fa-calendar-days"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="violationDescription" class="customLabel">السبب</label>
                                        <textarea class="form-control editReason customTextArea" id="editReason" placeholder="ادخل سبب تعديل بيانات المخالفة"></textarea>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="attachEditFile" class="customLabel">إرفاق مستند</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput attachEditFile form-control" id="attachEditFile" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
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
                                <div class="btnStyle confirmBtnGreen popupBtn confirmEdit" id="confirmEdit">تأكيد</div>
                                <div class="btnStyle cancelBtn popupBtn closeDetailsPopup" id="closeDetailsPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
  functions.declarePopup(
    ["generalPopupStyle", "greenPopup", "editPopup"],
    popupHtml
  );
  functions.inputDateFormat(".inputDate", "today");
  let request = {};
  let totalPrice = $(".editPrice").val();
  let endDate = $(".editDate").val();
  let editReason = $(".editReason").val();
  let editFiles;
  let countOfFiles;
  $(".dropFilesArea").hide();
  $(".attachEditFile").on("change", (e) => {
    editFiles = $(e.currentTarget)[0].files;
    if (editFiles.length > 0) {
      $(".dropFilesArea").show().empty();
    }
    for (let i = 0; i < editFiles.length; i++) {
      $(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${editFiles[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
    }
    $(".deleteFile").on("click", (e) => {
      let index = $(e.currentTarget).closest(".file").index();
      $(e.currentTarget).closest(".file").remove();
      let fileBuffer = new DataTransfer();
      for (let i = 0; i < editFiles.length; i++) {
        if (index !== i) {
          fileBuffer.items.add(editFiles[i]);
        }
      }
      editFiles = fileBuffer.files;
      countOfFiles = editFiles.length;
      if (countOfFiles == 0) {
        $(".dropFilesArea").hide();
      }
    });
  });

  $(".editPrice").on("keyup", (e) => {
    $(e.currentTarget).val($(e.currentTarget).val().split(",").join(""));
    $(e.currentTarget).val(
      $(e.currentTarget)
        .val()
        .replace(/\B(?=(?:\d{3})+(?!\d))/g, ",")
    );
    totalPrice = $(e.currentTarget).val();
  });
  $(".editDate").on("change", (e) => {
    endDate = $(e.currentTarget).val();
  });
  $(".editReason").on("change", (e) => {
    editReason = $(e.currentTarget).val();
  });

  $(".confirmEdit").on("click", (e) => {
    if (totalPrice != "" || endDate != "") {
      if (editReason != "") {
        if (editFiles != null && editFiles.length > 0) {
          request = {
            Data: {
              ID: TaskId,
              ViolationId: violationID,
              TotalPriceDue: totalPrice,
              ReconciliationExpiredDate: endDate,
              Comment: editReason,
            },
          };
          $(".overlay").addClass("active");
          validatedViolations.editViolationData(TaskId, request);
        } else {
          functions.warningAlert("من فضلك قم بإرفاق المستندات الخاصة بالتعديل");
        }
      } else {
        functions.warningAlert("من فضلك قم بإدخال سبب التعديل");
      }
    } else {
      functions.warningAlert(
        "من فضلك قم بإدخال قيمة المبلغ الإجمالي أو تاريخ انتهاء السداد"
      );
    }
  });
};
validatedViolations.editViolationData = (TaskId, request) => {
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
      console.log(data);
      validatedViolations.uploadTaskAttachment(
        TaskId,
        "ViolationsCycle",
        "#attachEditFile",
        "Edit"
      );
    })
    .catch((err) => {
      console.log(err);
    });
};

validatedViolations.uploadTaskAttachment = (
  TaskId,
  ListName,
  AttachInput,
  ActionType
) => {
  let Data = new FormData();
  Data.append("itemId", TaskId);
  Data.append("listName", ListName);
  for (let i = 0; i <= $(AttachInput)[0].files.length; i++) {
    Data.append("file" + i, $(AttachInput)[0].files[i]);
  }
  $.ajax({
    type: "POST",
    url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
    processData: false,
    contentType: false,
    data: Data,
    success: (data) => {
      $(".overlay").removeClass("active");
      if (ActionType == "Edit") {
        functions.sucessAlert("تم تعديل بيانات المخالفة بنجاح");
      } else if (ActionType == "PartPay") {
        functions.sucessAlert("تم سداد المبلغ بنجاح كجزء من المبلغ الكامل");
      } else if (ActionType == "FullPay") {
        functions.sucessAlert("تم سداد المبلغ بالكامل وإنهاء المخالفة");
      }
    },
    error: (err) => {
      functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
      $(".overlay").removeClass("active");
      console.log(err.responseText);
    },
  });
};

validatedViolations.filterViolationsLog = (e) => {
  let pageIndex = validatedViolations.pageIndex;
  let ViolationZoneVal = $("#violationZone").children("option:selected").val();
  let ViolationTypeVal = $("#TypeofViolation")
    .children("option:selected")
    .data("id");
  let PaymentStatusVal = $("#PaymentStatus").children("option:selected").val();
  let ViolationType;
  let ViolationZone;
  let PaymentStatus;

  if (
    ViolationTypeVal == "" &&
    ViolationZoneVal == "" &&
    PaymentStatusVal == ""
  ) {
    functions.warningAlert(
      "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
    );
  } else if (
    ViolationZoneVal != "" ||
    ViolationTypeVal != "0" ||
    PaymentStatusVal != ""
  ) {
    $(".PreLoader").addClass("active");
    ViolationZone = $("#violationZone").children("option:selected").val();
    ViolationType = Number(
      $("#TypeofViolation").children("option:selected").data("id")
    );
    PaymentStatus = $("#PaymentStatus").children("option:selected").val();
    validatedViolations.getValidatedViolations(
      pageIndex,
      true,
      ViolationZone,
      ViolationType,
      PaymentStatus
    );
  }
};

export default validatedViolations;
