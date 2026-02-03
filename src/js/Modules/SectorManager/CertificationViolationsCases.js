import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import confirmPopup from "../../Shared/confirmationPopup";
import pagination from "../../Shared/Pagination";

let certificationCases = {};
// certificationCases.pageIndex=1
certificationCases.dataObj = {
  destroyTable: false,
  caseStatus: "",
  ViolationCode: "",
  CaseNumber: "",
};
certificationCases.pageIndex = 1;

certificationCases.getViolationsCases = () => {
  let ShownRows = 10;
  let request = {
    Request: {
      RowsPerPage: ShownRows,
      PageIndex: pagination.currentPage,
      ColName: "ID",
      SortOrder: "desc",
      Status: certificationCases.dataObj.caseStatus,
      CaseNumber: certificationCases.dataObj.CaseNumber,
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
        if (data?.d?.Result?.GridData.length > 0) {
          Array.from(data.d.Result.GridData).forEach((element) => {
            Cases.push(element);
          });
        } else {
          Cases = [];
        }
      }

      certificationCases.setPaginations(ItemsData.TotalPageCount, ShownRows);
      certificationCases.ViolationsCasesTable(
        Cases,
        certificationCases.dataObj.destroyTable
      );
      certificationCases.pageIndex = ItemsData.CurrentPage;
    })
    .catch((err) => {});
};

certificationCases.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", certificationCases.getViolationsCases);
  pagination.activateCurrentPage();
};

certificationCases.ViolationsCasesTable = (Cases) => {
  let data = [];
  if (certificationCases.dataObj.destroyTable) {
    $("#CertificationCasesLogTable").DataTable().destroy();
  }
  if (Cases.length > 0) {
    Cases.forEach((caseRecord) => {
      let caseViolation = caseRecord.Violation;

      data.push([
        `<div class="violationCode noWrapContent" data-caseid="${caseRecord.ID}" data-violationid="${caseRecord.ViolationId}" data-taskid="${caseRecord.ViolationId}" data-taskid="${caseRecord.TaskId}" data-casestatus="${caseRecord.Status}" data-casenumber="${caseRecord.CaseNumber}" data-violationcode="${caseRecord.ViolationCode}" data-oldprice="${caseViolation?.TotalOldPrice}" data-newprice="${caseViolation?.TotalPriceDue}">${caseRecord.ViolationCode}</div>`,
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
        // `<div class="caseComments">${caseRecord.Comments != ""?caseRecord.Comments:"-----"}</div>`,
       
      ]);
    });
  }
  certificationCases.dataObj.destroyTable = true;
  let Table = functions.tableDeclare(
    "#CertificationCasesLogTable",
    data,
    [
      { title: "رقم المخالفة" },
      { title: "", class: "all" },
      { title: "تاريخ الإحالة" },
      { title: "رقم القضية" },
      { title: "الحالة" },
      { title: "المرفقات" },
      // { title: "ملاحظات", class:"caseCommentsBox"},
    ],
    false,
    false,
    "سجل القضايا المسجلة.xlsx",
    "سجل القضايا المسجلة"
  );
  $(".ellipsisButton").on("click", (e) => {
    $(".hiddenListBox").hide(300);
    $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
  });
  let UserId = _spPageContextInfo.userId;
  let casesLog = Table.rows().nodes().to$();
  functions.callSharePointListApi("Configurations").then((Users) => {
    let UserDetails;
    let UsersData = Users.value;
    UsersData.forEach((User) => {
      if (
        User.UserIdId.find((id) => id == UserId) &&
        User.JobTitle1 == "مسؤول التصديقات"
      ) {
        UserDetails = User;
      }
    });
    $(".detailsPopupForm").addClass("validatedViolations");
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
      // <li><a href="#" class="editViolation">تعديل المخالفة</a></li>
      // if(UserDetails.Permissions == "Full"){
      //     switch(caseStatus){
      //         case("قيد مراجعة النيابة المختصة"):{
      //             jQueryRecord.find(".controls").children(".hiddenListBox").find(".controlsList").append(`
      //                 <li><a href="#" class="addCaseNumber">إضافة رقم القضية</a></li>
      //             `);
      //             break;
      //         }
      //         case("منظورة"):{
      //             jQueryRecord.find(".controls").children(".hiddenListBox").find(".controlsList").append(`
      //                 <li><a href="#" class="addCaseAttachment">إرفاق مستند للقضية</a></li>
      //                 <li><a href="#" class="editCasePrice">تعديل مبلغ القضية</a></li>
      //                 <li><a href="#" class="printPaymentForm">طباعة نموذج السداد</a></li>
      //                 <li><a href="#" class="payCase">تسديد القضية</a></li>
      //                 <li><a href="#" class="saveCase">حفظ القضية</a></li>
      //             `);
      //             // <li><a href="#" class="requestPetition">تقديم بيان التماس</a></li>
      //             break;
      //         }
      //         case("مسددة"):{
      //             jQueryRecord.find(".controls").children(".hiddenListBox").find(".controlsList").append(`
      //                 <li><a href="#" class="reopenCase">إعادة فتح القضية</a></li>
      //             `);
      //             break;
      //         }
      //         case("محفوظة"):{
      //             jQueryRecord.find(".controls").children(".hiddenListBox").find(".controlsList").append(`
      //                 <li><a href="#" class="reopenCase">إعادة فتح القضية</a></li>
      //             `);
      //             break;
      //         }
      //     }
      // }
      if (
        casesLog.length > 3 &&
        hiddenListBox.height() > 110 &&
        jQueryRecord.is(":nth-last-child(-n + 4)")
      ) {
        hiddenListBox.addClass("toTopDDL");
      }
      jQueryRecord.find(".caseAttachments").on("click", (e) => {
        // $(".overlay").addClass("active");
        // certificationCases.FindCaseById(e,caseID,"Details");
        certificationCases.getCaseAttachmentsByCaseId(caseID, caseNumber);
      });
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".itemDetails")
        .on("click", (e) => {
          // $(".overlay").addClass("active");
          certificationCases.FindCaseById(caseID);
        });
    });
  });
  functions.hideTargetElement(".controls", ".hiddenListBox");
};

certificationCases.getCaseAttachmentsByCaseId = (CaseId, caseNumber) => {
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
        certificationCases.caseAttachmentsDetailsPopup(
          CaseId,
          caseNumber,
          CaseAttachmentsRecords
        );
      }
    })
    .catch((err) => {
      console.log(err);
      functions.warningAlert("هناك خطأ في إرسال بيانات الطلب");
    });
};

certificationCases.caseAttachmentsDetailsPopup = (
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
  certificationCases.drawCaseAttachmentsPopupTable(
    "#caseAttachmentsTable",
    CaseAttachmentsRecords
  );
};
certificationCases.drawCaseAttachmentsPopupTable = (
  TableId,
  CaseAttachmentsRecords
) => {
  $(".overlay").removeClass("active");
  let data = [];
  let counter = 1;
  if (CaseAttachmentsRecords.length > 0) {
    CaseAttachmentsRecords.forEach((attchRecord) => {
      console.log(attchRecord);
      let attachedFilesData = attchRecord.Attachments;
      data.push([
        `<div class="attachCount">${counter}</div>`,
        `<div class="attachFiles" data-fileslength="${
          attachedFilesData.length
        }">${certificationCases.drawAttachmentsInTable(
          attachedFilesData
        )}</div>`,
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
    // console.log(attachComments)
    // console.log(attachComments.css("height"))
    // console.log(attachComments.height())
    // console.log(attachComments.css("line-height"))
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

certificationCases.drawAttachmentsInTable = (Attachments) => {
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
certificationCases.FindCaseById = (CaseID, popupType = "") => {
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
      console.log(data);
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
            Content = certificationCases.getCaseDetails(caseData);
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
            Content = certificationCases.getCaseDetails(caseData);
            functions.declarePopup(
              ["generalPopupStyle", "greenPopup", "caseDetailsPopup"],
              Content
            );
          }
        } else if (OffenderType == "Equipment") {
          if (popupType == "PaymentFormPrint") {
            $(".overlay").removeClass("active");
            Content = DetailsPopup.printPaymentForm(caseViolation);
            functions.declarePopup(
              ["generalPopupStyle", "paymentFormDetailsPopup"],
              Content
            );
          } else {
            $(".overlay").removeClass("active");
            Content = certificationCases.getCaseDetails(caseData);
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
    .catch((err) => {
      console.log(err);
    });
};
certificationCases.getCaseDetails = (caseData) => {
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
                                    ? certificationCases.caseQuarryDetails(
                                        caseViolation
                                      )
                                    : certificationCases.caseVehicleDetails(
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
certificationCases.caseQuarryDetails = (violationData) => {
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
certificationCases.caseVehicleDetails = (violationData) => {
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

// certificationCases.FindCaseById = (CaseID, popupType = "") => {
//     let request = {
//         Id: CaseID,
//     };
//     functions.requester("/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/FindById", request)
//         .then((response) => {
//             if (response.ok) {
//                 return response.json();
//             }
//         })
//         .then((data) => {

//             let caseData;
//             let caseViolation
//             let violationOffenderType;
//             let Content;
//             let printBox;
//             if (data != null) {
//                 caseData = data.d.Result
//                 caseViolation = data.d.Result.Violation
//                 violationOffenderType = caseViolation.OffenderType
//                 if (violationOffenderType == "Quarry") {
//                     if (popupType == "PaymentFormPrint") {
//                         $(".overlay").removeClass("active");
//                         Content = DetailsPopup.printPaymentForm(caseViolation)
//                         functions.declarePopup(["generalPopupStyle", "paymentFormDetailsPopup"], Content);
//                     } else {
//                         // Content = DetailsPopup.quarryDetailsPopupContent(violationData,"القائمة");
//                         // printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
//                         // functions.declarePopup(["generalPopupStyle", "detailsPopup"],printBox);
//                     }
//                 } else {
//                     if (popupType == "PaymentFormPrint") {
//                         $(".overlay").removeClass("active");
//                         Content = DetailsPopup.printPaymentForm(caseViolation)
//                         functions.declarePopup(["generalPopupStyle", "paymentFormDetailsPopup"], Content);
//                     } else {
//                         // Content = DetailsPopup.vehicleDetailsPopupContent(violationData,"القائمة");
//                         // printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
//                         // functions.declarePopup(["generalPopupStyle", "detailsPopup"],printBox);
//                     }
//                 }
//                 $(".printConfirmationForm").hide()
//                 $(".printPaymentForm").on("click", (e) => {
//                     functions.PrintDetails(e)
//                 })
//                 // $(".printBtn").on("click", (e) => {
//                 //     functions.PrintDetails(e);
//                 // });
//             } else {
//                 caseData = null;
//             }
//         })
//         .catch((err) => {

//         });
// }

certificationCases.filterViolationsLog = (e) => {
  // let pageIndex = certificationCases.pageIndex
  let CaseNumber = $("#caseNumber").val();
  let CaseStatusVal = $("#CaseStatus").children("option:selected").val();
  let CaseStatus;

  if (CaseNumber == "" && CaseStatusVal == "") {
    functions.warningAlert(
      "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
    );
  } else if (CaseNumber != "" || CaseStatusVal != "") {
    $(".PreLoader").addClass("active");
    CaseStatus = $("#CaseStatus").children("option:selected").val();
    certificationCases.dataObj.caseStatus = CaseStatus;
    certificationCases.dataObj.CaseNumber = CaseNumber;

    certificationCases.getViolationsCases();
  }
};
export default certificationCases;
