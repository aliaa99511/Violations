import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import confirmPopup from "../../Shared/confirmationPopup";
import pagination from "../../Shared/Pagination";

let violationsCases = {
  dataObj: {
    destroyTable: false,
  },
};
violationsCases.pageIndex = 1;

violationsCases.getViolationsCases = () => {
  let ShownRows = 10;
  let request = {
    Request: {
      RowsPerPage: ShownRows,
      PageIndex: pagination.currentPage,
      ColName: "ID",
      SortOrder: "desc",
      Status: violationsCases.caseStatus,
      CaseNumber: violationsCases.CaseNumber,
    },
  };

  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/Search",
      request
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      $(".PreLoader").removeClass("active");
      let Cases = [];
      let ItemsData = data?.d?.Result;

      if (data?.d?.Result?.GridData != null) {
        if (data.d.Result.GridData.length > 0) {
          Array.from(data.d.Result.GridData).forEach((element) => {
            Cases.push(element);
          });
        } else {
          Cases = [];
        }
      }

      violationsCases.setPaginations(ItemsData.TotalPageCount, ShownRows);
      violationsCases.ViolationsCasesTable(
        Cases,
        violationsCases.dataObj.destroyTable
      );
      violationsCases.pageIndex = ItemsData.CurrentPage;
    })
    .catch((err) => {});
};

violationsCases.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", violationsCases.getViolationsCases);
  pagination.activateCurrentPage();
};

violationsCases.ViolationsCasesTable = (Cases) => {
  let data = [];
  if (Cases.length > 0) {
    Cases.forEach((caseRecord) => {
      let caseViolation = caseRecord?.Violation;
      let createdDate = functions.getFormatedDate(caseRecord.Created);
      data.push([
        `<div class="violationCode noWrapContent" data-caseid="${caseRecord.ID}" data-violationid="${caseRecord.ViolationId}" data-taskid="${caseRecord.TaskId}" data-casestatus="${caseRecord.Status}" data-casenumber="${caseRecord.CaseNumber}" data-violationcode="${caseRecord.ViolationCode}" data-oldprice="${caseViolation?.TotalOldPrice}" data-newprice="${caseViolation?.TotalPriceDue}">${caseRecord.ViolationCode}</div>`,
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
        `<div class="violationReffereDate noWrapContent">${functions.getFormatedDate(
          caseRecord.RefferedDate
        )}</div>`,
        `<div class="caseNumber">${
          caseRecord.CaseNumber != "" ? caseRecord.CaseNumber : "-----"
        }</div>`,
        `<div class="caseStatus">${caseRecord.Status}</div>`,
        `<div class="caseAttachments"><a href="#!">المرفقات</a></div>`,
        // `<div class="caseStatus">${createdDate}</div>`,
        // `<div class="caseComments">${caseRecord.Comments != ""?caseRecord.Comments:"-----"}</div>`,
       
      ]);
    });
  }
  let Table = functions.tableDeclare(
    "#CasesLogTable",
    data,
    [
      { title: "رقم المخالفة" },
      { title: "", class: "all" },
      { title: "تاريخ الإحالة" },
      { title: "رقم القضية" },
      { title: "الحالة" },
      { title: "المرفقات" },
      // { title: "تاريخ الإنشاء" },
      // { title: "ملاحظات", class:"caseCommentsBox"},
    ],
    false,
    violationsCases.dataObj.destroyTable,
    "سجل القضايا.xlsx",
    "سجل القضايا"
  );
  if (violationsCases.dataObj.destroyTable) {
    $("#CasesLogTable").DataTable().destroy();
  }
  $(".ellipsisButton").on("click", (e) => {
    $(".hiddenListBox").hide(300);
    $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
  });
  let UserId = _spPageContextInfo.userId;
  let casesLog = Table.rows().nodes().to$();
  violationsCases.dataObj.destroyTable = true;
  functions.callSharePointListApi("Configurations").then((Users) => {
    let UserDetails;
    let UsersData = Users.value;
    UsersData.forEach((User) => {
      if (User.UserIdId.find((id) => id == UserId)) {
        UserDetails = User;
      }
    });
    // $(".detailsPopupForm").addClass("validatedViolations")
    $.each(casesLog, (index, record) => {
      let jQueryRecord = $(record);
      let caseID = jQueryRecord.find(".violationCode").data("caseid");
      let violationID = jQueryRecord.find(".violationCode").data("violationid");
      let taskID = jQueryRecord.find(".violationCode").data("taskid");
      let caseNumber = jQueryRecord.find(".violationCode").data("casenumber");
      let violationCode = jQueryRecord
        .find(".violationCode")
        .data("violationcode");
      let caseStatus = jQueryRecord.find(".violationCode").data("casestatus");
      let hiddenListBox = jQueryRecord
        .find(".controls")
        .children(".hiddenListBox");
      let oldPrice = jQueryRecord.find(".violationCode").data("oldprice");
      let total_new_Price = jQueryRecord
        .find(".violationCode")
        .data("newprice");
      // <li><a href="#" class="editViolation">تعديل المخالفة</a></li>
      switch (caseStatus) {
        case "قيد مراجعة النيابة المختصة": {
          jQueryRecord
            .find(".controls")
            .children(".hiddenListBox")
            .find(".controlsList").append(`
                            <li><a href="#" class="addCaseNumber">إضافة رقم القضية</a></li>
                        `);
          break;
        }
        case "منظورة": {
          jQueryRecord
            .find(".controls")
            .children(".hiddenListBox")
            .find(".controlsList").append(`
                            <li><a href="#" class="addCaseAttachment">إرفاق مستند للقضية</a></li>
                            <li><a href="#" class="editCasePrice">تعديل مبلغ القضية</a></li>
                            <!-- li><a href="#" class="printPaymentForm">طباعة نموذج السداد</a></li> -->
                            <li><a href="#" class="payCase">تسديد القضية</a></li>
                            <li><a href="#" class="saveCase">حفظ القضية</a></li>
                        `);
          // <li><a href="#" class="requestPetition">تقديم بيان التماس</a></li>
          break;
        }
        case "مسددة": {
          jQueryRecord
            .find(".controls")
            .children(".hiddenListBox")
            .find(".controlsList").append(`
                            <li><a href="#" class="reopenCase">إعادة فتح القضية</a></li>
                        `);
          break;
        }
        case "محفوظة": {
          jQueryRecord
            .find(".controls")
            .children(".hiddenListBox")
            .find(".controlsList").append(`
                            <li><a href="#" class="reopenCase">إعادة فتح القضية</a></li>
                        `);
          break;
        }
      }
      if (
        casesLog.length > 3 &&
        hiddenListBox.height() > 110 &&
        jQueryRecord.is(":nth-last-child(-n + 4)")
      ) {
        hiddenListBox.addClass("toTopDDL");
      }
      jQueryRecord
        .find(".caseAttachments")
        .find("a")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          violationsCases.getCaseAttachmentsByCaseId(caseID, caseNumber);
        });
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".itemDetails")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          violationsCases.FindCaseById(caseID);
        });
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".printPaymentForm ")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          violationsCases.FindCaseById(caseID, "PaymentFormPrint");
        });
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".addCaseNumber")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          violationsCases.addCaseNumberPopup(
            caseID,
            violationID,
            violationCode
          );
        });
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".addCaseAttachment")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          violationsCases.addAttachmentToCase(caseID, violationID, caseNumber);
          // violationsCases.findCaseByID(e,caseID,"Details");
        });
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".editCasePrice")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          violationsCases.editCasePrice(
            caseID,
            violationID,
            caseNumber,
            oldPrice,
            total_new_Price
          );
          // violationsCases.findCaseByID(e,caseID,"Details");
        });
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".payCase")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          violationsCases.payCasePrice(
            caseID,
            violationID,
            taskID,
            caseNumber,
            total_new_Price
          );
        });
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".saveCase")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          violationsCases.saveCase(caseID, violationID, taskID, caseNumber);
        });
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".reopenCase")
        .on("click", (e) => {
          // $(".overlay").addClass("active");
          // violationsCases.findCaseByID(e,caseID,"Details");
        });
    });
    functions.getCurrentUserActions();
  });
  functions.hideTargetElement(".controls", ".hiddenListBox");
};

violationsCases.FindCaseById = (CaseID, popupType = "") => {
  let request = {
    Id: CaseID,
  };
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/FindById",
      request
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      let caseData;
      let caseViolation;
      let violationOffenderType;
      let Content;
      if (data != null) {
        caseData = data.d.Result;
        caseViolation = caseData.Violation;

        violationOffenderType = caseViolation.OffenderType;
        if (violationOffenderType == "Quarry") {
          if (popupType == "PaymentFormPrint") {
            $(".overlay").removeClass("active");
            Content = DetailsPopup.printPaymentForm(caseViolation);
            functions.declarePopup(
              ["generalPopupStyle", "paymentFormDetailsPopup"],
              Content
            );
          } else {
            $(".overlay").removeClass("active");
            Content = violationsCases.getCaseDetails(caseData);
            functions.declarePopup(
              ["generalPopupStyle", "greenPopup", "caseDetailsPopup"],
              Content
            );
          }
        } else if (violationOffenderType == "Vehicle") {
          if (popupType == "PaymentFormPrint") {
            $(".overlay").removeClass("active");
            Content = DetailsPopup.printPaymentForm(caseViolation);
            functions.declarePopup(
              ["generalPopupStyle", "paymentFormDetailsPopup"],
              Content
            );
          } else {
            $(".overlay").removeClass("active");
            Content = violationsCases.getCaseDetails(caseData);
            functions.declarePopup(
              ["generalPopupStyle", "greenPopup", "caseDetailsPopup"],
              Content
            );
          }
        } else if (violationOffenderType == "Equipment") {
          if (popupType == "PaymentFormPrint") {
            $(".overlay").removeClass("active");
            Content = DetailsPopup.printPaymentForm(caseViolation);
            functions.declarePopup(
              ["generalPopupStyle", "paymentFormDetailsPopup"],
              Content
            );
          } else {
            $(".overlay").removeClass("active");
            Content = violationsCases.getCaseDetails(caseData);
            functions.declarePopup(
              ["generalPopupStyle", "greenPopup", "caseDetailsPopup"],
              Content
            );
          }
        }
        $(".printConfirmationForm").hide();
        $(".printPaymentForm").on("click", (e) => {
          functions.PrintDetails(e);
        });
        $(".printBtn").on("click", (e) => {
          functions.PrintDetails(e);
        });
      } else {
        caseData = null;
      }
    })
    .catch((err) => {});
};

violationsCases.addCaseNumberPopup = (CaseID, ViolationID, ViolationCode) => {
  $(".overlay").removeClass("active");
  let popupHtml = `
        <div class="popupHeader">
            <div class="violationsCode"> 
                <p> أضافة رقم القضية للمخالفة رقم (${ViolationCode})</p>
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
                                        <label for="caseNumber" class="customLabel">رقم القضية</label>
                                        <input class="form-control customInput caseNumber" id="caseNumber" type="text" placeholder="أدخل رقم القضية">
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="caseNumberAttach" class="customLabel">إرفاق مستند رقم القضية</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput caseNumberAttach form-control" id="caseNumberAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
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
                                <div class="btnStyle confirmBtnGreen popupBtn AddCaseNumberBtn" id="AddCaseNumberBtn">تأكيد</div>
                                <div class="btnStyle cancelBtn popupBtn closeCaseNumberPopup" id="closeCaseNumberPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>`;
  functions.declarePopup(
    ["generalPopupStyle", "greenPopup", "editPopup"],
    popupHtml
  );
  let CaseNumberInput = $("#caseNumber").val();
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
  $("#caseNumberAttach").on("change", (e) => {
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
          "من فضلك أدخل الملفات بالامتدادات المسموح بها فقط"
        );
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings(".dropFilesArea")
          .hide();
        $(e.currentTarget).val("");
      }
    }
  });
  $("#caseNumber").on("keyup", (e) => {
    CaseNumberInput = $(e.currentTarget).val().trim();
  });
  $(".AddCaseNumberBtn").on("click", (e) => {
    if (CaseNumberInput != "") {
      if (allAttachments != null && allAttachments.length > 0) {
        request = {
          Request: {
            Title: "تم إضافة رقم القضية",
            Status: "منظورة",
            CaseNumber: CaseNumberInput,
            ViolationId: ViolationID,
            ID: CaseID,
          },
        };
        $(".overlay").addClass("active");
        violationsCases.editCaseAPIResponse(
          request,
          CaseID,
          "إضافة رقم القضية",
          "#caseNumberAttach",
          "تم إضافة رقم القضية"
        );
      } else {
        functions.warningAlert(
          "من فضلك قم بإرفاق المستند المرفق به رقم القضية"
        );
      }
    } else {
      functions.warningAlert("من فضلك قم بإضافة رقم القضية بشكل صحيح");
    }
  });
  // return popupHtml;
};

violationsCases.editCasePrice = (
  CaseID,
  ViolationID,
  caseNumber,
  oldPrice,
  TotalViolationPrice
) => {
  $(".overlay").removeClass("active");
  let popupHtml = `
        <div class="popupHeader">
            <div class="violationsCode"> 
                <p> تعديل مبلغ القضية رقم (${caseNumber})</p>
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
                                        <label for="oldViolationPrice" class="customLabel">المبلغ القديم (مبلغ المخالفة)</label>
                                        <input class="form-control disabled customInput oldViolationPrice" id="oldViolationPrice" type="text" value="${functions.splitBigNumbersByComma(
                                          TotalViolationPrice
                                        )}" disabled>
                                    </div> 
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="newViolationPrice" class="customLabel">المبلغ المعدل</label>
                                        <input class="form-control customInput newViolationPrice" id="newViolationPrice" type="text" placeholder="أدخل المبلغ الجديد">
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="editCasePriceAttach" class="customLabel">إرفاق مستند إعادة التقييم</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput editCasePriceAttach form-control" id="editCasePriceAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
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
                                <div class="btnStyle confirmBtnGreen popupBtn editCasePriceBtn" id="editCasePriceBtn">تعديل</div>
                                <div class="btnStyle cancelBtn popupBtn closeCasePricePopup" id="closeCasePricePopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>`;
  functions.declarePopup(
    ["generalPopupStyle", "greenPopup", "editPopup"],
    popupHtml
  );
  let newPriceInput = $("#newViolationPrice").val();
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
  let PositiveDecimalNumbers = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;
  let request = {};

  $("#editCasePriceAttach").on("change", (e) => {
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
          "من فضلك أدخل الملفات بالامتدادات المسموح بها فقط"
        );
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings(".dropFilesArea")
          .hide();
        $(e.currentTarget).val("");
      }
    }
  });
  $("#newViolationPrice").on("keypress", (e) => {
    return functions.isDecimalNumberKey(e);
  });
  $("#newViolationPrice").on("keyup", (e) => {
    $(e.currentTarget).val($(e.currentTarget).val().split(",").join(""));
    $(e.currentTarget).val(
      $(e.currentTarget)
        .val()
        .replace(/\B(?=(?:\d{3})+(?!\d))/g, ",")
    );
    newPriceInput = $(e.currentTarget).val();
    newPriceInput = newPriceInput.replace(/\,/g, "");
    newPriceInput = Number(newPriceInput);
  });
  $("#editCasePriceBtn").on("click", (e) => {
    if (newPriceInput != "" && PositiveDecimalNumbers.test(newPriceInput)) {
      if (allAttachments != null && allAttachments.length > 0) {
        request = {
          Request: {
            Title: "تم تعديل مبلغ القضية",
            ViolationId: ViolationID,
            ID: CaseID,
            TotalPrice: newPriceInput,
            TotalOldPrice: TotalViolationPrice,
          },
        };
        $(".overlay").addClass("active");
        violationsCases.editCaseAPIResponse(
          request,
          CaseID,
          "تعديل المبلغ",
          "#editCasePriceAttach",
          "تم تعديل مبلغ المخالفة بناء على إعادة التقييم"
        );
      } else {
        functions.warningAlert(
          "من فضلك قم بإرفاق المستند الخاص بإعادة التقييم"
        );
      }
    } else {
      functions.warningAlert("من فضلك قم بإدخال المبلغ الجديد بشكل صحيح");
    }
  });
};

violationsCases.payCasePrice = (
  CaseID,
  ViolationID,
  TaskID,
  caseNumber,
  TotalViolationPrice
) => {
  $(".overlay").removeClass("active");
  let popupHtml = `
        <div class="popupHeader">
            <div class="violationsCode"> 
                <p> تسديد القضية رقم (${caseNumber})</p>
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
                                        <label for="violationCasePrice" class="customLabel">المبلغ المطلوب سداده</label>
                                        <input class="form-control disabled customInput violationCasePrice" id="violationCasePrice" type="text" value="${functions.splitBigNumbersByComma(
                                          TotalViolationPrice
                                        )}" disabled>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="payCaseAttachment" class="customLabel">إرفاق إيصال السداد</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput payCaseAttachment form-control" id="payCaseAttachment" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
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
                                <div class="btnStyle confirmBtnGreen popupBtn payCaseBtn" id="payCaseBtn">تأكيد</div>
                                <div class="btnStyle cancelBtn popupBtn closePayCasePopup" id="closePayCasePopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>`;
  functions.declarePopup(
    ["generalPopupStyle", "greenPopup", "editPopup"],
    popupHtml
  );
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
  $("#payCaseAttachment").on("change", (e) => {
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
          "من فضلك أدخل الملفات بالامتدادات المسموح بها فقط"
        );
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings(".dropFilesArea")
          .hide();
        $(e.currentTarget).val("");
      }
    }
  });
  $(".payCaseBtn").on("click", (e) => {
    if (allAttachments != null && allAttachments.length > 0) {
      request = {
        Request: {
          Title: "تم تسديد القضية",
          ViolationId: ViolationID,
          ID: CaseID,
          Status: "مسددة",
          TaskId: TaskID,
        },
      };
      $(".overlay").addClass("active");
      violationsCases.changeTaskStatusAfterPayCase(TaskID, ViolationID, "Paid");
      violationsCases.editCaseAPIResponse(
        request,
        CaseID,
        "إيصال السداد",
        "#payCaseAttachment",
        "تم تسديد مبلغ القضية"
      );
    } else {
      functions.warningAlert("من فضلك قم بإرفاق إيصال السداد");
    }
  });
};

violationsCases.saveCase = (CaseID, ViolationID, taskID, caseNumber) => {
  $(".overlay").removeClass("active");
  let popupHtml = `
        <div class="popupHeader">
            <div class="violationsCode"> 
                <p> حفظ القضية رقم (${caseNumber})</p>
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
                                        <label for="saveCaseAttach" class="customLabel">إرفاق مستند تأكيد الحفظ</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput saveCaseAttach form-control" id="saveCaseAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
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
                                <div class="btnStyle confirmBtnGreen popupBtn saveCaseBtn" id="saveCaseBtn">حفظ</div>
                                <div class="btnStyle cancelBtn popupBtn closeSaveCasePopup" id="closeSaveCasePopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
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

  $("#saveCaseAttach").on("change", (e) => {
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
          "من فضلك أدخل الملفات بالامتدادات المسموح بها فقط"
        );
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings(".dropFilesArea")
          .hide();
        $(e.currentTarget).val("");
      }
    }
  });
  $("#saveCaseBtn").on("click", (e) => {
    if (allAttachments != null && allAttachments.length > 0) {
      request = {
        Request: {
          Title: "تم حفظ القضية",
          ViolationId: ViolationID,
          ID: CaseID,
          Status: "محفوظة",
        },
      };
      $(".overlay").addClass("active");
      violationsCases.changeTaskStatusAfterPayCase(taskID, ViolationID, "Save");
      violationsCases.editCaseAPIResponse(
        request,
        CaseID,
        "حفظ القضية",
        "#saveCaseAttach",
        "تم حفظ القضية"
      );
    } else {
      functions.warningAlert("من فضلك قم بإرفاق المستند الخاص بحفظ القضية");
    }
  });
};

violationsCases.addAttachmentToCase = (CaseID, ViolationID, caseNumber) => {
  $(".overlay").removeClass("active");
  let popupHtml = `
        <div class="popupHeader">
            <div class="violationsCode"> 
                <p> حفظ القضية رقم (${caseNumber})</p>
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
                                        <label for="addCaseAttachComments" class="customLabel">الملاحظات</label>
                                        <textarea class="form-control addCaseAttachComments customTextArea" id="addCaseAttachComments" placeholder="أدخل سبب إضافة المستند"></textarea>
                                    </div>
                                    <div class="form-group customFormGroup">
                                        <label for="addCaseAttach" class="customLabel">إرفاق مستند</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput addCaseAttach form-control" id="addCaseAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
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
                                <div class="btnStyle confirmBtnGreen popupBtn addCaseAttachBtn" id="addCaseAttachBtn">حفظ</div>
                                <div class="btnStyle cancelBtn popupBtn closeAddCaseAttachPopup" id="closeAddCaseAttachPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>`;
  functions.declarePopup(
    ["generalPopupStyle", "greenPopup", "editPopup"],
    popupHtml
  );
  let caseAttachComments = $("#addCaseAttachComments").val();
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

  $("#addCaseAttachComments").on("keyup", (e) => {
    caseAttachComments = $(e.currentTarget).val().trim();
  });

  $("#addCaseAttach").on("change", (e) => {
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
          "من فضلك أدخل الملفات بالامتدادات المسموح بها فقط"
        );
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings(".dropFilesArea")
          .hide();
        $(e.currentTarget).val("");
      }
    }
  });
  $("#addCaseAttachBtn").on("click", (e) => {
    if (caseAttachComments != "") {
      if (allAttachments != null && allAttachments.length > 0) {
        $(".overlay").addClass("active");
        violationsCases.addNewCaseAttachmentRecord(
          CaseID,
          "إرفاق مستند خلال إجراءات القضية",
          "#addCaseAttach",
          "تم إرفاق مستند للقضية بنجاح",
          caseAttachComments
        );
      } else {
        functions.warningAlert("من فضلك قم بإرفاق المستند قبل الحفظ");
      }
    } else {
      functions.warningAlert("من فضلك قم بإدخال سبب/حالة إرفاق المستند");
    }
  });
};

violationsCases.editCaseAPIResponse = (
  request,
  CaseId,
  uploadPhase,
  attachInput,
  Message = ""
) => {
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/Save",
      request
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      if (data.d.Status) {
        violationsCases.addNewCaseAttachmentRecord(
          CaseId,
          uploadPhase,
          attachInput,
          Message
        );
      } else {
        functions.warningAlert("هناك خطأ في إرسال بيانات الطلب");
      }
    })
    .catch((err) => {});
};

violationsCases.addNewCaseAttachmentRecord = (
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
        violationsCases.uploadCaseAttachments(
          RecordId,
          attachInput,
          "CasesAttachments",
          Message
        );
      } else {
        functions.warningAlert("هناك خطأ في إرسال بيانات الطلب");
      }
    })
    .catch((err) => {});
};

violationsCases.uploadCaseAttachments = (
  RecordId,
  attachInput,
  ListName,
  Message
) => {
  let Data = new FormData();
  Data.append("itemId", RecordId);
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
    success: (data) => {
      $(".overlay").removeClass("active");
      functions.sucessAlert(Message);
    },
    error: (err) => {
      functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
      $(".overlay").removeClass("active");
    },
  });
};

violationsCases.changeTaskStatusAfterPayCase = (
  TaskId,
  ViolationId,
  ActionType
) => {
  let request = {
    Data: {
      ID: TaskId,
      ViolationId: ViolationId,
      Status: ActionType == "Paid" ? "Paid After Reffered" : "Saved",
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
    .then((data) => {})
    .catch((err) => {});
};

violationsCases.getCaseAttachmentsByCaseId = (CaseId, caseNumber) => {
  let request = {
    Request: {
      // RowsPerPage:20,
      // PageIndex:1,
      ColName: "created",
      SortOrder: "asc",
      CaseId: CaseId,
    },
  };
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/CaseAttachments.aspx/Search",
      request
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      let CaseAttachmentsRecords;
      if (data.d.Status) {
        if (data.d.Result.length > 0) {
          CaseAttachmentsRecords = data.d.Result;
        } else {
          CaseAttachmentsRecords = [];
        }
        violationsCases.caseAttachmentsDetailsPopup(
          CaseId,
          caseNumber,
          CaseAttachmentsRecords
        );
      }
    })
    .catch((err) => {
      functions.warningAlert("هناك خطأ في إرسال بيانات الطلب");
    });
};

violationsCases.caseAttachmentsDetailsPopup = (
  CaseId,
  caseNumber,
  CaseAttachmentsRecords
) => {
  let popupHtml = `
        <div class="popupHeader attachPopup">
            <div class="violationsCode"> 
                <p> مرفقات القضية رقم (${caseNumber})</p>
            </div>
            <div class="btnStyle cancelBtn popupBtn closeCaseAttachPopup" id="closeCaseAttachPopup" data-dismiss="modal" aria-label="Close"><i class="fa-solid fa-x"></i></div>
        </div> 
        <div class="popupBody">
            <div class="popupTableBox">
                <table id="caseAttachmentsTable" class="table tableWithIcons popupTable"></table>
            </div>
        </div>`;
  functions.declarePopup(
    ["generalPopupStyle", "greenPopup", "editPopup", "attachPopup"],
    popupHtml
  );
  violationsCases.drawCaseAttachmentsPopupTable(
    "#caseAttachmentsTable",
    CaseAttachmentsRecords
  );
};

violationsCases.drawCaseAttachmentsPopupTable = (
  TableId,
  CaseAttachmentsRecords
) => {
  $(".overlay").removeClass("active");
  let data = [];
  let counter = 1;
  if (CaseAttachmentsRecords.length > 0) {
    CaseAttachmentsRecords.forEach((attchRecord) => {
      let attachedFilesData = attchRecord.Attachments;
      data.push([
        `<div class="attachCount">${counter}</div>`,
        `<div class="attachFiles" data-fileslength="${
          attachedFilesData.length
        }">${violationsCases.drawAttachmentsInTable(attachedFilesData)}</div>`,
        `<div class="attachUploadPhase">${attchRecord.UploadPhase}</div>`,
        `<div class="attachUploadDate">${functions.getFormatedDate(
          attchRecord.Created,
          "DD-MM-YYYY hh:mm A"
        )}</div>`,
        `<div class="attachComments">${
          attchRecord.Comments != ""
            ? attchRecord.Comments /*+" <a href='#!'>عرض المزيد</a>"*/
            : "----"
        }</div>`,
      ]);
      counter++;
    });
  }
  let Table = functions.tableDeclare(
    TableId,
    data,
    [
      { title: "م", class: "tableCounter" },
      { title: "المرفقات", class: "attachBoxHeader" },
      { title: "سبب الإرفاق" },
      { title: "تاريخ الإرفاق" },
      { title: "ملاحظات" },
    ],
    false,
    false
  );
  let caseAttachmentsLog = Table.rows().nodes().to$();
  $.each(caseAttachmentsLog, (index, record) => {
    let jQueryRecord = $(record);
    let attachComments = jQueryRecord.find(".attachComments");
    let attachFiles = jQueryRecord.find(".attachFiles");
    let attachFilesLength = jQueryRecord
      .find(".attachFiles")
      .data("fileslength");
    //
    //
    //
    //
    if (attachFilesLength == 1) {
      attachFiles.find(".attchedFile").addClass("singleFile");
    }
    if (attachFilesLength == 2) {
      attachFiles.find(".attchedFile").addClass("multibleFiles");
    }
    if (attachFilesLength >= 3) {
      attachFiles.find(".attchedFile").addClass("manyFiles");
    }
  });
};

violationsCases.drawAttachmentsInTable = (Attachments) => {
  let attachmentsBox = ``;

  if (Attachments.length > 0) {
    Attachments.forEach((attachment) => {
      attachmentsBox += `
                <a class="attchedFile" target="_blanck" href="${attachment.Url}" download="${attachment.Url}" title="${attachment.Name}">
                    <div class="attachDetailsBox">
                        <p class="attchedFileName">${attachment.Name}</p>
                    </div>
                    <span><i class="fa-solid fa-download"></i></span>
                </a>
            `;
    });
  } else {
    attachmentsBox = `<p class="noAttachedFiles">لا يوجد مرفقات</p>`;
  }
  return attachmentsBox;
};

violationsCases.getCaseDetails = (caseData) => {
  let caseViolation = caseData.Violation;
  let violationOffenderType = caseViolation.OffenderType;
  let popupTitle;
  if (caseData.Status == "قيد مراجعة النيابة المختصة") {
    popupTitle = `تفاصيل القضية عن المخالفة المحالة رقم (${caseData.ViolationCode})`;
  } else {
    popupTitle = `تفاصيل القضية رقم (${caseData.CaseNumber})`;
  }
  let popupHtml = `
    <div class="caseDetialsPrintBox" id="printJS-form">
        <div class="popupHeader">
            <div class="popupTitleBox">
                <div class="CaseNumberBox">
                    <p class="caseNumber">${popupTitle}</p>  
                    <div class="printBtn"><img src="/Style Library/MiningViolations/images/WhitePrintBtn.png" alt="Print Button"></div>
                </div>
                <div class="btnStyle cancelBtn popupBtn closeCaseDetailsPopup" id="closeCaseDetailsPopup" data-dismiss="modal" aria-label="Close">
                    <i class="fa-solid fa-x"></i>
                </div>
            </div> 
        </div>
        <div class="popupBody">
            <div class="popupForm detailsPopupForm" id="detailsPopupForm">
                <div class="formContent">
                    <div class="formBox">
                        <div class="formBoxHeader">
                            <p class="formBoxTitle"><span class="formNumber">1</span> تفاصيل القضية</p>
                        </div>
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="caseNumber" class="customLabel">رقم القضية</label>
                                        <input class="form-control customInput caseNumber" id="caseNumber" type="text" value="${
                                          caseData.CaseNumber != ""
                                            ? caseData.CaseNumber
                                            : "----"
                                        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="refferedDate" class="customLabel">تاريخ الإحالة</label>
                                        <input class="form-control customInput refferedDate" id="refferedDate" type="text" value="${functions.getFormatedDate(
                                          caseData.RefferedDate
                                        )}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="caseNumber" class="customLabel">الحالة</label>
                                        <input class="form-control customInput caseNumber" id="caseNumber" type="text" value="${
                                          caseData.Status
                                        }" disabled>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="formContent">
                    <div class="formBox">
                        <div class="formBoxHeader">
                            <p class="formBoxTitle"><span class="formNumber">2</span> تفاصيل المخالفة</p>
                        </div>
                        <div class="formElements">
                            <div class="row">
                                ${
                                  violationOffenderType == "Quarry"
                                    ? violationsCases.caseQuarryDetails(
                                        caseViolation
                                      )
                                    : violationsCases.caseVehicleDetails(
                                        caseViolation
                                      )
                                }
                            </div>
                        </div>
                    </div>
                </div>

                <div class="formButtonsBox">
                    <div class="row">
                        <div class="col-12">
                            <div class="buttonsBox centerButtonsBox ">
                                <div class="btnStyle cancelBtn popupBtn closeDetailsPopup" id="closeDetailsPopup" data-dismiss="modal" aria-label="Close">إغلاق</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>`;

  return popupHtml;
};
violationsCases.caseQuarryDetails = (violationData) => {
  let detailsHtml = `
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationCode" class="customLabel">رقم المخالفة</label>
                <input class="form-control customInput violationCode" id="violationCode" type="text" value="${
                  violationData.ViolationCode
                }" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violatorName" class="customLabel">إسم المخالف</label>
                <input class="form-control customInput violatorName" id="violatorName" type="text" value="${
                  violationData.ViolatorName
                }" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violatorCompany" class="customLabel">الشركة المخالفة التابع لها</label>
                <input class="form-control customInput violatorCompany" id="violatorCompany" type="text" value="${
                  violationData.ViolatorCompany != ""
                    ? violationData.ViolatorCompany
                    : "----"
                }" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationType" class="customLabel">نوع المخالفة</label>
                <input class="form-control customInput violationType" id="violationType" type="text" value="${
                  violationData.ViolationTypes.Title
                }" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="materialType" class="customLabel">نوع الخام</label>
                <input class="form-control customInput materialType" id="materialType" type="text" value="${
                  violationData.Material != null
                    ? violationData.Material.Title
                    : "----"
                }" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationGov" class="customLabel">المحافظة</label>
                <input class="form-control customInput violationGov" id="violationGov" type="text" value="${
                  violationData.Governrates != null
                    ? violationData.Governrates.Title
                    : "----"
                }" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationZone" class="customLabel">منطقة الضبط</label>
                <input class="form-control customInput violationZone" id="violationZone" type="text" value="${
                  violationData.ViolationsZone
                }" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationDate" class="customLabel">تاريخ الضبط</label>
                <input class="form-control customInput violationDate" id="violationDate" type="text" value="${functions.getFormatedDate(
                  violationData.ViolationDate
                )}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationTime" class="customLabel">وقت الضبط</label>
                <input class="form-control customInput violationTime" id="violationTime" type="text" value="${functions.getFormatedDate(
                  violationData.ViolationTime,
                  "hh:mm A"
                )}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationPrice" class="customLabel">المبلغ المقدر في المخالفة</label>
                <input class="form-control customInput violationPrice" id="violationPrice" type="text" value="${
                  violationData.TotalPriceDue
                }" disabled>
            </div>
        </div>
    `;
  return detailsHtml;
};
violationsCases.caseVehicleDetails = (violationData) => {
  let detailsHtml = `
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationCode" class="customLabel">رقم المخالفة</label>
                <input class="form-control customInput violationCode" id="violationCode" type="text" value="${
                  violationData.ViolationCode
                }" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violatorName" class="customLabel">إسم المخالف</label>
                <input class="form-control customInput violatorName" id="violatorName" type="text" value="${
                  violationData.ViolatorName
                }" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violatorCompany" class="customLabel">الشركة المخالفة التابع لها</label>
                <input class="form-control customInput violatorCompany" id="violatorCompany" type="text" value="${
                  violationData.ViolatorCompany != ""
                    ? violationData.ViolatorCompany
                    : "----"
                }" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="carNumber" class="customLabel">رقم العربة</label>
                <input class="form-control customInput carNumber" id="carNumber" type="text" value="${
                  violationData.CarNumber
                }" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="vehicleType" class="customLabel">نوع العربة</label>
                <input class="form-control customInput vehicleType" id="vehicleType" type="text" value="${
                  violationData.VehicleType
                }" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="materialType" class="customLabel">نوع الخام</label>
                <input class="form-control customInput materialType" id="materialType" type="text" value="${
                  violationData.Material != null
                    ? violationData.Material.Title
                    : "----"
                }" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationGov" class="customLabel">المحافظة</label>
                <input class="form-control customInput violationGov" id="violationGov" type="text" value="${
                  violationData.Governrates != null
                    ? violationData.Governrates.Title
                    : "----"
                }" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationZone" class="customLabel">منطقة الضبط</label>
                <input class="form-control customInput violationZone" id="violationZone" type="text" value="${
                  violationData.ViolationsZone
                }" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationDate" class="customLabel">تاريخ الضبط</label>
                <input class="form-control customInput violationDate" id="violationDate" type="text" value="${functions.getFormatedDate(
                  violationData.ViolationDate
                )}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationTime" class="customLabel">وقت الضبط</label>
                <input class="form-control customInput violationTime" id="violationTime" type="text" value="${functions.getFormatedDate(
                  violationData.ViolationTime,
                  "hh:mm A"
                )}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationPrice" class="customLabel">المبلغ المقدر في المخالفة</label>
                <input class="form-control customInput violationPrice" id="violationPrice" type="text" value="${
                  violationData.TotalPriceDue
                }" disabled>
            </div>
        </div>
    `;
  return detailsHtml;
};

violationsCases.filterViolationsLog = (e) => {
  // let pageIndex = violationsCases.pageIndex
  let CaseNumber = $("#CaseNumber").val();
  let CaseStatusVal = $("#CaseStatus").children("option:selected").val();
  let CaseStatus;

  if (CaseNumber == "" && CaseStatusVal == "") {
    functions.warningAlert(
      "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
    );
  } else if (CaseNumber != "" || CaseStatusVal != "") {
    $(".PreLoader").addClass("active");
    CaseStatus = $("#CaseStatus").children("option:selected").val();
    violationsCases.caseStatus = CaseStatus;
    violationsCases.CaseNumber = CaseNumber;
    violationsCases.getViolationsCases();
  }
};
export default violationsCases;
