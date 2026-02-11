import bootpopup from "../Libraries/bootpopup";
import Swal from "sweetalert2";
import printJS from "print-js";
import XLSX from "xlsx";
const functions = {};

functions.stripHTML = (html) => {
  if (!html) return "";
  let div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};

functions.exportDataTable = (options) => {
  const {
    tableSelector,
    fileName = "export.xlsx",
    sheetName = "Sheet1",
    headers = null,
    ignoreLastColumns = 0,
    onlyVisible = true,
    rtl = true,
    columnWidths = 25,
  } = options;

  let table = $(tableSelector).DataTable();
  let data = [];

  // Headers
  if (headers) {
    data.push(headers);
  } else {
    let autoHeaders = [];
    $(tableSelector + " thead th").each(function () {
      autoHeaders.push($(this).text().trim());
    });
    data.push(autoHeaders);
  }

  // Rows
  table.rows(onlyVisible ? { search: "applied" } : {}).every(function () {
    let row = this.data();

    let cleanRow = row
      .slice(0, row.length - ignoreLastColumns)
      .map((cell) => functions.stripHTML(cell));

    data.push(cleanRow);
  });

  let ws = XLSX.utils.aoa_to_sheet(data);

  if (rtl) ws["!dir"] = "rtl";

  ws["!cols"] = data[0].map(() => ({ wch: columnWidths }));

  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  XLSX.writeFile(wb, fileName);
};

functions.setUserDetailsSideMenu = (UserType, UserJop, UserSector = "") => {
  $(".userDetails")
    .find(".userName")
    .text(UserJop == "الأرشيف" ? "فرع المخالفات" : UserJop);
  if (UserType == "Recorder") {
    $(".userDetails")
      .find(".userSector")
      .text("( " + UserSector + " )");
    // $(".userDetails").find(".userName").css("margin-bottom", "0.75rem");
  }
  // $(".userDetails").find(".userEmail").text(UserEmail)
};
functions.callSharePointListApi = (ListName) => {
  return new Promise(function (resolve, reject) {
    $.ajax({
      type: "GET",
      url:
        _spPageContextInfo.siteAbsoluteUrl +
        "/_api/web/lists/getbytitle('" +
        ListName +
        "')/items?$top=1000",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: (data) => {
        if (data != null) {
          resolve(data);
        } else {
          resolve([]);
        }
      },
      error: (xhr) => { },
    });
  });
};
functions.getSiteName = () => {
  return $("#identify").attr("site-name");
};
functions.getPageName = () => {
  return $("#identify").attr("page-name");
};
functions.setPageMetaData = (pageName) => {
  // $(".pageTitleBox .pageTitleImageBox").find("img").attr("src", pageImageSrc);
  $(".pageNameBox").find("p.pageName").text(pageName);
};
functions.tableDeclare = (
  tableID,
  tableData,
  tableColumns,
  showPaging,
  destroyTable = false,
  exportFileName = "Violations.xlsx",
  exportSheetName = "Violations"
) => {
  let tableOptions = {
    dom: "t<'Tablepaginate'p>",
    responsive: true,
    fixedColumns: true,
    pageLength: 10,
    data: tableData,
    paging: showPaging,
    ordering: false,
    language: {
      info: "_START_ - _END_ / _TOTAL_",
      infoFiltered: "",
      infoEmpty: "0 - 0 / 0",
      emptyTable: `لا يوجد بيانات`,
      zeroRecords: `لا يوجد بيانات بنتيجة البحث`,
      paginate: {
        next: `<i class="fa-solid fa-chevron-right"></i>`,
        previous: `<i class="fa-solid fa-chevron-left"></i>`,
      },
    },
    columns: tableColumns,
    columnDefs: [
      {
        ordering: false,
        orderable: true,
        targets: "sort",
      },
      {
        orderable: false,
        targets: "no-sort",
      },
    ],
  };

  if (destroyTable) {
    $(tableID).DataTable().destroy();
  }

  let Table = $(tableID).DataTable(tableOptions);
  $("#exportBtn").on("click", () => {
    functions.exportDataTable({
      tableSelector: tableID,
      fileName: exportFileName,
      sheetName: exportSheetName,
      headers: tableColumns.map((col) => col.title),
      ignoreLastColumns: 2,
      onlyVisible: true,
      rtl: true,
      columnWidths: 25,
    });
  });
  return Table;
};
functions.tableSearch = (
  Table,
  colNumber,
  searchInputID,
  eventType = "keyup"
) => {
  $(`${searchInputID}`).on(eventType, function (e) {
    let key = $(e.currentTarget).val().toString().trim();
    if (key.length > 0) {
      Table.columns(colNumber).search(key).draw();
    } else {
      Table.columns(colNumber).search(key).draw();
    }
  });
};

functions.requester = (url, data) => {
  let otherParams;
  otherParams = {
    headers: { "content-type": "application/json; charset=UTF-8" },
    body: JSON.stringify(data),
    method: "POST",
    dataType: "json",
  };
  return fetch(`${url}`, otherParams);
};

functions.requesterGET = (url) => {
  let otherParams;
  otherParams = {
    method: "GET",
    headers: { Accept: "application/json; odata=verbose" },
    dataType: "json",
  };
  return fetch(`${url}`, otherParams);
};
functions.declarePopup = (styleClassName, Content) => {
  bootpopup({
    // size: "normal",
    content: [`${Content}`],
    before: () => {
      $(".modal:last-child .modal-title").text("");
      // $(".modal:last-child .modal-header").find(".close").children("span").remove();
      // $(".modal:last-child .modal-header").find(".close").append('<img src="/Style Library/PurchasingCompany/images/X.png">');
      $(".modal:last-child").attr("data-backdrop", "static");
      $(".modal:last-child").attr("data-keyboard", "true");
      $(".modal:last-child").addClass(styleClassName);
    },
    showclose: true,
  });
};
functions.hideTargetElement = (element, targetEl) => {
  $(document).on("click", (event) => {
    if (!$(event.target).closest(element).length > 0) {
      $(targetEl).hide(300);
    }
  });
};
functions.showDropDownList = (e) => {
  $(e.currentTarget).find("p").toggleClass("rotateDDL");
  $(e.currentTarget).closest(".selectBox").find(".dropDownBox").slideToggle();
};
functions.selectDropDownOption = (e) => {
  let targetInput = $(e.currentTarget);
  let DDLBox = targetInput.closest(".selectBox");
  DDLBox.find(".dropDownBox").slideUp(300);
  DDLBox.children(".selectHeader").find("p").removeClass("rotateDDL");
  DDLBox.find(".selectTitle").text(targetInput.val());
};
functions.sucessAlert = (Message, reload = true, url = "") => {
  $(".modal").hide();
  Swal.fire({
    icon: "success",
    title: "تم بنجاح",
    text: Message,
    confirmButtonText: "إغلاق",
    customClass: "sweetStyle",
  }).then(() => {
    if (reload == true) {
      window.location.reload();
    } else {
      window.location.href = url;
    }
  });
};
functions.warningAlert = (Message, Selector = null) => {
  Swal.fire({
    icon: "warning",
    title: "حدث خطأ ما",
    text: Message,
    confirmButtonText: "إغلاق",
    customClass: "sweetStyle",
  }).then(() => {
    if (Selector != null) {
      $("#s4-workspace").animate({ scrollTop: $(Selector).offset().top }, 800);
    }
    // else if (Selector != null && modal == false) {
    //   // $(window).scrollTop($(Selector).offset().top)
    //   $(window).animate(
    //     {
    //       scrollTop: $(Selector).offset().top,
    //     },
    //     2000
    //   );
    // }
  });
};
functions.disableButton = (e) => {
  e.preventDefault();
  let Button = $(e.currentTarget);
  Button.attr("disabled", "disabled");
  Button.off("click");
  Button.prepend(
    '<i class="fas fa-spinner Spinner" style="animation:rotation 1s ease-in-out infinite"></i> '
  );
};
functions.inputDateFormat = (
  input,
  startDate = "",
  endDate = "",
  format = "mm-dd-yyyy"
) => {
  $(input).datepicker({
    format: format,

    todayHighlight: true,
    // startDate: startDate,
    endDate: endDate,
    autoclose: true,
  });
};
functions.getFormatedDate = (unForamttedDate, format = "DD-MM-YYYY") => {
  // functions.getFormatedDate = (unForamttedDate, format = "MM-DD-YYYY") => {

  let localDate = new Date(
    Number(
      unForamttedDate?.substring(
        unForamttedDate.indexOf("(") + 1,
        unForamttedDate.lastIndexOf(")")
      )
    )
  ).toLocaleString();
  let formatedDate = moment(localDate).format(format);
  return formatedDate;
};
functions.getViolationArabicName = (OffenderType, violationArabicName = "") => {
  let violationArType = "-";
  if (OffenderType == "Quarry") {
    violationArType =
      violationArabicName != "" ? violationArabicName : "محجر مخالف";
  } else if (OffenderType == "Vehicle") {
    violationArType = "عربة مخالفة";
  } else if (OffenderType == "Equipment") {
    violationArType = "معدة مخالفة";
  } else {
    violationArType = "-";
  }
  return violationArType;
};
functions.getViolationPaymentArabicName = (OffenderType) => {
  let violationArType = "-";
  if (OffenderType == "Quarry") {
    violationArType = "نموذج سداد مخالفة المحجر رقم";
  } else if (OffenderType == "Vehicle") {
    violationArType = "نموذج سداد مخالفة العربة رقم";
  } else if (OffenderType == "Equipment") {
    violationArType = "نموذج سداد مخالفة المعدة رقم";
  } else {
    violationArType = "-";
  }
  return violationArType;
};
functions.redirectUser = () => {
  let UserId = _spPageContextInfo.userId;
  functions.callSharePointListApi("Configurations").then((Users) => {
    let UsersData = Users.value;
    UsersData.forEach((User) => {
      if (User.UserIdId.find((id) => id == UserId)) {
        switch (User.JobTitle1) {
          case "القائم بالضبط": {
            window.location.href =
              _spPageContextInfo.siteAbsoluteUrl + "/ViolationsRecorder";
            // $(".PreLoader").removeClass("active");
            break;
          }
          case "فرع المخالفات":
          case "مسئول مالي":
          case "مسئول قضايا":
          case "مسئول احالة":
          case "مسؤل الإلتماسات":
          case "الأرشيف": {
            window.location.href =
              _spPageContextInfo.siteAbsoluteUrl + "/ViolationsBranch";
            // $(".PreLoader").removeClass("active");
            break;
          }
          case "مسؤول التصديقات": {
            window.location.href =
              _spPageContextInfo.siteAbsoluteUrl + "/CertificationOfficer";
            // $(".PreLoader").removeClass("active");
            break;
          }
          case "الشركة المصرية للتعدين": {
            window.location.href =
              _spPageContextInfo.siteAbsoluteUrl + "/CertificationOfficer";
            // $(".PreLoader").removeClass("active");
            break;
          }
        }
      }
    });
  });
};
functions.splitBigNumbersByComma = (budgetNumber) => {
  return budgetNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
functions.PrintDetails = (e) => {
  e.preventDefault();
  printJS({
    documentTitle: "Shipment Order Details",
    printable: "printJS-form",
    type: "html",
    css: [
      "/Style Library/MiningViolations/CSS/style.css",
      // "/Style Library/MiningViolations/CSS/main.css",
    ],
    scanStyles: false,
    targetStyle: ["border:1px solid red"],
    // ignoreElements: ["btnsContainer", "printBtnBox"],
    onLoadingStart: function () {
      $(".overlay").addClass("active");
    },
    onLoadingEnd: function () {
      $(".overlay").removeClass("active");
    },
  });
};
functions.getViolationStartDate = (NumberOfDays) => {
  let last_n_Days;
  let dateFun = new Date();
  let today = dateFun.getDate();
  let dayVal =
    today - NumberOfDays > 9
      ? "/" + (today - NumberOfDays)
      : "/0" + (today - NumberOfDays);
  let currentMonth = dateFun.getMonth() + 1;
  let monthVal = currentMonth > 9 ? currentMonth : "0" + currentMonth;
  let currentYear = "/" + dateFun.getFullYear();
  last_n_Days = dayVal + monthVal + currentYear;
  return last_n_Days;
};

functions.checkApisResponse = (data) => {
  let responseStatus = false;
  if (data != "" && data != null) {
    responseStatus = true;
  } else {
    responseStatus = false;
  }
  return responseStatus;
};
functions.getCurrentDateTime = (formatType = "") => {
  let date = new Date();
  // let todayNextN_Days = date.setDate(date.getDate() + 25)
  let today = date.getDate();
  let dayVal = today > 9 ? today + "-" : "-0" + today;
  let currentMonth = date.getMonth() + 1;
  let monthVal = currentMonth > 9 ? currentMonth : "0" + currentMonth;
  let currentYear = "-" + date.getFullYear();
  let timeNow =
    date.getHours() > 12
      ? "PM" + (date.getHours() - 12) + ":" + date.getMinutes()
      : "AM" + date.getHours() + ":" + date.getMinutes();
  let todayDateTime;
  if (formatType == "DateTime") {
    todayDateTime = timeNow + " " + dayVal + monthVal + currentYear;
  }
  if (formatType == "Date" || formatType == "") {
    todayDateTime = dayVal + monthVal + currentYear;
  }
  if (formatType == "Time") {
    todayDateTime = timeNow;
  }
  return todayDateTime;
};
functions.getNDaysAfterCurrentDate = (numberOfDays) => {
  let nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + numberOfDays);
  let formattedDate = moment(nextDate.toLocaleString()).format(
    "MM/DD/YYYY hh:mm a"
  );
  return formattedDate;
};
functions.getNDaysAfterCurrentDate(30);
functions.isNumberKey = (e) => {
  let charCode = e.which ? e.which : e.keyCode;
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    return false;
  }
  return true;
};
functions.isDecimalNumberKey = (e) => {
  let charCode = e.which ? e.which : e.keyCode;
  if (charCode == 46) {
    //Check if the text already contains the . character
    if ($(e.currentTarget).val().indexOf(".") === -1) {
      return true;
    } else {
      return false;
    }
  } else {
    if (charCode > 31 && (charCode < 48 || charCode > 57)) return false;
  }
  return true;
};
functions.isArabicLetter = (e) => {
  let charCode = e.which ? e.which : e.keyCode;
  if (charCode >= 1569 && charCode <= 1610) {
    return true;
  }
  return false;
};
functions.getNameInTriple = (Input) => {
  let nameCount = 3;
  let validName = false;
  let InputVal = $(Input).val();
  let splitedEnteredValue = InputVal.split(" ");
  let result = /([a-zA-Z\u0600-\u06FF,-\d]+( |$)){3}/;
  if (result.test(InputVal)) {
    validName = true;
  } else {
    validName = false;
  }
  return validName;
};
functions.uploadAttachmentsByInput = (AttchInput) => {
  $(".dropFilesArea").hide();
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
  $(AttchInput).on("change", (e) => {
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
  return allAttachments;
};
// functions.test = (ListName)=>{
//   let dataX={};
//   $.ajax({
//     type: "GET",
//     url: _spPageContextInfo.siteAbsoluteUrl + "/_api/web/lists/getbytitle('" +ListName +"')/items",
//     contentType: "application/json; charset=utf-8",
//     dataType: "json",
//     success: (data) => {
//       if (data != null) {
//
//         dataX = data;
//       } else {
//         dataX = null
//
//       }
//     },
//     error: (xhr) => {
//
//     },
//   });
//   return dataX
// }
// let x = functions.test("Violations")
//
var removePendingViolationOptions = () => {
  $("#PendingViolation").find(".controls").remove();
};
var removeRejectedViolationOptions = () => {
  $("#RejectedViolation").find(".controls").remove();
};
var removeSectorManagerOptions = () => {
  $("#SectorManager").find(".controls").remove();
};
var removePetitionsOptions = () => {
  $("#PetitionsTable")
    .find(".itemDetails, .approvePetition, .rejectPetition")
    .remove();
};
var removeValidatedViolationOptions = () => {
  $("#ValidatedViolation").find(".controls").remove();
};
var removeCaseLogOptions = () => {
  $("#CasesLogTable").find(".controls").remove();
};
var removeRunningViolationsOptions = () => {
  $("#RunningViolations").find(".controls").remove();
};

functions.delegateActions = () => {
  // RunningTasks table
  $("#SectorManager").find(".confirmViolationPopup").remove();
  // ValidatedViolations table
  $("#ValidatedViolation")
    .find(".payViolation, .requestPetition, .reffereViolation")
    .remove();
  // PetitionsTable
  $("#PetitionsTable").find(".approvePetition, .rejectPetition").remove();
  // CasesLogTable
  $("#CasesLogTable")
    .find(".caseStatus")
    .each((i, el) => {
      if ($(el).text() == "قيد مراجعة النيابة المختصة") {
        $(el).closest("tr").find(".ellipsisButton").remove();
      }
      if ($(el).text() == "منظورة") {
        $(el)
          .closest("tr")
          .find(".addCaseAttachment, .payCase, .saveCase")
          .remove();
      }
      if ($(el).text() == "مسددة") {
        $(el).closest("tr").find(".reopenCase").remove();
      }
    });
  $("#CasesLogTable").find(".reopenCase").remove();
};
functions.certificationOfficerActions = () => {
  removePendingViolationOptions();
  $("#SectorManager").find(".itemDetails").remove();
  removeRejectedViolationOptions();
  $("#ValidatedViolation")
    .find(".payViolation, .printPaymentForm, .reffereViolation")
    .remove();
  removePetitionsOptions();

  $("#CasesLogTable").find(".caseAttachments").remove();
  $("#ValidatedViolation")
    .find(".statusText")
    .each((i, el) => {
      if ($(el).text() == "تجاوز مدة السداد") {
        $(el).closest("tr").find(".controls").remove();
      }
    });
  removeCaseLogOptions();
  removeRunningViolationsOptions();
};
functions.financialOfficerActions = () => {
  removePendingViolationOptions();
  removeSectorManagerOptions();
  removeRejectedViolationOptions();
  removeRunningViolationsOptions();
  $("#ValidatedViolation")
    .find(".itemDetails, .requestPetition, .reffereViolation")
    .remove();
  removePetitionsOptions();
  $("#CasesLogTable")
    .find(".caseStatus")
    .each((i, el) => {
      if ($(el).text() == "قيد مراجعة النيابة المختصة") {
        $(el).closest("tr").find(".controls").remove();
      }
      if ($(el).text() == "منظورة") {
        $(el)
          .closest("tr")
          .find(".saveCase, .addCaseAttachment, .editCasePrice, .saveCase")
          .remove();
      }
    });
  $("#CasesLogTable").find(".reopenCase").remove();
};
functions.casesOfficerActions = () => {
  removePendingViolationOptions();
  removeSectorManagerOptions();
  removeRejectedViolationOptions();
  $("#ValidatedViolation")
    .find(".statusText")
    .each((i, el) => {
      if ($(el).text() != "تجاوز مدة السداد") {
        $(el).closest("tr").find(".controls").remove();
      } else {
        $(el)
          .closest("tr")
          .find(".reffereViolation, .payViolation, .requestPetition")
          .remove();
      }
    });
  $("#CasesLogTable")
    .find(".caseStatus")
    .each((i, el) => {
      if ($(el).text() == "منظورة") {
        $(el)
          .closest("tr")
          .find(".editCasePrice, .printPaymentForm, .payCase")
          .remove();
      }
    });
  $("#CasesLogTable").find(".saveCase, .reopenCase").remove();
};
functions.referralOfficerActions = () => {
  removePendingViolationOptions();
  removeSectorManagerOptions();
  removeRejectedViolationOptions();
  $("#ValidatedViolation")
    .find(".statusText")
    .each((i, el) => {
      if ($(el).text() != "تجاوز مدة السداد") {
        $(el).closest("tr").find(".controls").remove();
      } else {
        $(el).closest("tr").find(" .payViolation, .requestPetition").remove();
      }
    });
  removeCaseLogOptions();
};
functions.directorActions = () => {
  $("#PendingViolation")
    .find(".ApprovedViolation, .RejectedViolations")
    .remove();
  $("#SectorManager")
    .find(".confirmViolationPopup, .printConfirmationForm")
    .remove();
  $("#ValidatedViolation")
    .find(
      ".payViolation, .printPaymentForm, .reffereViolation, .requestPetition"
    )
    .remove();
  $("#CasesLogTable")
    .find(
      ".addCaseAttachment,.editCasePrice, .printPaymentForm, .payCase, .saveCase, .addCaseNumber, .reopenCase"
    )
    .remove();
};
functions.archives = () => {
  $("#PendingViolation").find(".controlsList a:not(.itemDetails)").remove();
  $("#SectorManager").find(".controlsList a:not(.itemDetails)").remove();
  $("#ValidatedViolation").find(".controlsList a:not(.itemDetails)").remove();
  $("#CasesLogTable").find(".controlsList a:not(.itemDetails)").remove();
  $("#PetitionsTable").find(".controlsList a:not(.itemDetails)").remove();
};

functions.sectorActions = () => {
  removePendingViolationOptions();
  removeSectorManagerOptions();
  removeRejectedViolationOptions();
  removeRunningViolationsOptions();
  removePetitionsOptions();
};

functions.getCurrentUserActions = async () => {
  let UserId = _spPageContextInfo.userId;
  let currentUserActions;
  let currentUserTitle;
  let currentUserJobTitle;
  await functions
    .callSharePointListApi("Configurations")
    .then((Users) => {
      let UsersData = Users.value;
      UsersData.forEach((User) => {
        if (User.UserIdId.find((id) => id == UserId)) {
          currentUserJobTitle = User.subJobTitle;
          currentUserTitle = User.JobTitle1;

          currentUserActions = User.UserActionsId;
        }
      });
    })
    .then((data) => {
      // All pending violations conditions will be here
      if (currentUserTitle != "الشركة المصرية للتعدين") {
        switch (currentUserTitle) {
          case "نائب مدير":
            functions.delegateActions();
            break;
          case "مسؤول التصديقات":
          case "مسؤل الإلتماسات":
            functions.certificationOfficerActions();
            break;
          case "مسئول مالي":
            functions.financialOfficerActions();
            break;
          case "مسئول قضايا":
            functions.casesOfficerActions();
            break;
          case "مسئول احالة":
            functions.referralOfficerActions();
            break;
          case "مدير عام":
            functions.directorActions();
            break;
          case "القائم بالضبط":
            functions.sectorActions();
            break;
          case "الأرشيف":
            functions.archives();
            break;

          default:
            break;
        }
      }
    });
};
functions.commonEditData = (
  violationData,
  ViolationId,
  defaultCoordinatesDots,
  violationDataParentObj
) => {
  $("#violatorName").val(violationData.ViolatorName);
  $("#violatorNationalId").val(violationData.NationalID);
  $("#prevViolationsCount").val(violationData.NumOfPreviousViolations);
  $("#companyName").val(violationData.ViolatorCompany);
  $("#commercialRegister").val(violationData.CommercialRegister);
  $("#violationGov").val(violationData.Governrates.Code).trigger("change");
  $("#violationArea").val(violationData.ViolationsZone);
  // if it's car or equipment violation
  if (violationDataParentObj) {
    $("#violationCarType").val(violationData.VehicleType).trigger("change");
    if (violationData.CarNumber == "") {
      $("#unmarkedCheckbox").trigger("click");
    }
    let firstDigit = violationData.CarNumber.match(/\d/);
    let TrailerDigit = violationData.TrailerNum.match(/\d/);
    let carPlateNumberDigits = violationData.CarNumber.indexOf(firstDigit);
    $("#carLicenseLetters").val(
      violationData.CarNumber.slice(0, carPlateNumberDigits)
    );
    $("#carLicenseNumbres").val(
      violationData.CarNumber.slice(carPlateNumberDigits)
    );
    $("#carLicenseColor").val(violationData.CarColor);
    let TrailerPlateNumberDigits =
      violationData.TrailerNum.indexOf(TrailerDigit);
    $("#tractorLetters").val(
      violationData.TrailerNum?.slice(0, TrailerPlateNumberDigits)
    );
    $("#tractorNumbers").val(
      violationData.TrailerNum?.slice(TrailerPlateNumberDigits)
    );
    $("#carBrand").val(violationData.VehicleBrand);
    $("#carLicenseTraffic").val(violationData.TrafficName);
    $("#driverLicenseNumber").val(violationData.DrivingLicense);
    $(".driverLicenseTraffic").val(violationData.TrafficLicense);
    $("#carViolationRawType")
      .val(violationData.Material?.Title)
      .trigger("change");
    $("#RawQuantity").val(violationData.MaterialAmount).trigger("change");
  } else {
    $("#violationType")
      .val(violationData.ViolationTypes?.Title)
      .trigger("change");
    $("#quarryViolationRawType")
      .val(violationData.Material?.Title)
      .trigger("change");
  }

  $("#violationDate")
    .val(moment(violationData?.ViolationDate).format("DD/MM/YYYY"))
    .trigger("change");
  $("#violationTime")
    .val(functions.getFormatedDate(violationData?.ViolationTime, "HH:mm"))
    .trigger("change");
  function getViolationCoords(Coordinates, defaultCoordinatesDots) {
    let splitedCoords = Coordinates.split("],");
    let filteredCoords;
    if (splitedCoords.length > defaultCoordinatesDots) {
      let remainingCoordinates = splitedCoords.length - defaultCoordinatesDots;
      for (let index = 0; index < remainingCoordinates; index++) {
        $("#AddPoint").trigger("click");
      }
    }
    let tableCellsValues = [];
    splitedCoords.forEach((singleCoord, index) => {
      tableCellsValues.push(
        singleCoord
          .replace(/[^0-9\.]+/g, " ")
          .trim()
          .split(" ")
          .slice(0, 3)
      );
      tableCellsValues.push(
        singleCoord
          .replace(/[^0-9\.]+/g, " ")
          .trim()
          .split(" ")
          .slice(3)
      );
    });
    let tableCells = $(
      ".table-bordered tbody tr:not(:first-child) td:not(:last-child)"
    );
    $(tableCells).each((arrIndex, element) => {
      $(element)
        .find("input")
        .each((index, element) => {
          $(element).val(tableCellsValues[arrIndex][index]);
        });
    });
    $("#violationDescription").val(violationData.Description);
    $("#membersText").html(violationData.SectorMembers);
    let membersList = [];
    violationData.CommiteeMember.split("\n").forEach((member, index) => {
      membersList.push(member.replace(/ /g, ""));
    });
    $("#committeeMemberSelect option").each((index, element) => {
      if (membersList.includes($(element).text().replace(/ /g, ""))) {
        $(element).prop("selected", true);
      }
    });
    $(".submitSelectedMembersBtn").trigger("click");
    $("#sectorManegrOpinion").val(violationData.LeaderOpinion);
    $.ajax({
      type: "POST",
      url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Get",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify({
        id: ViolationId,
        listName: "Violations",
      }),
      success: (data) => {
        async function fetchAndAssignFileOnClick(fileObj, fileInput) {
          try {
            // Fetch the file content
            const response = await fetch(fileObj.Url);
            const blob = await response.blob();

            // Create a File object from the Blob
            const fileName = fileObj.Name; // You can set the desired file name
            const file = new File([blob], fileName, { type: blob.type });

            // Attach event listener to a button click
            button.addEventListener("click", () => {
              // Create a new FileList with our File object
              const fileList = new DataTransfer();
              fileList.items.add(file);

              // Assign the FileList to the file input element

              fileInput.files = fileList.files;

              $(fileInput).trigger("change");
            });
            $("#fetchAttachmentsBtn").trigger("click");
          } catch (error) {
            console.error("Error fetching file:", error);
          }
        }

        // Usage: Call fetchAndAssignFileOnClick with your URL and file input element
        const fileInputs = [
          document.getElementById("attachViolationFiles"),
          document.getElementById("attachViolationReportFile"),
        ]; // Replace with your file input element ID

        const button = document.getElementById("fetchAttachmentsBtn"); // Replace with your button element ID
        // Function to fetch the file and assign it to a file input on button click

        data.d.forEach((element, index) => {
          let file = data.d[index];

          fetchAndAssignFileOnClick(file, fileInputs[index]);
        });

        // URL of the file you want to fetch
      },
      error: (xhr) => {
        console.log(xhr.responseText);
      },
    });
  }
  getViolationCoords(violationData.CoordinatesDegrees, defaultCoordinatesDots);
};
functions.getPetitionsStatus = (petitionStatus) => {
  let statusHtml = ``;
  switch (petitionStatus) {
    case "قيد الإنتظار":
    case "التماس قيد الإنتظار": {
      statusHtml = `<div class="statusBox pendingStatus">
                            <i class="statusIcon fa-regular fa-clock"></i>
                            <span>${petitionStatus}</span>
                        </div>`;
      break;
    }
    case "التماس مرفوض": {
      statusHtml = `<div class="statusBox warningStatus">
                            <i class="fa-regular fa-circle-xmark"></i>
                            <span>${petitionStatus}</span>
                        </div>`;
      break;
    }
    case "قبول مع التعديل": {
      statusHtml = `<div class="statusBox modifiedStatus">
                            <i class="statusIcon fa-regular fa-circle-check"></i>
                            <span>${petitionStatus}</span>
                        </div>`;
      break;
    }
    case "قبول وإلغاء المخالفة": {
      statusHtml = `<div class="statusBox approvedCancelStatus">
                            <i class="statusIcon fa-regular fa-circle-check"></i>
                            <span>${petitionStatus}</span>
                        </div>`;
      break;
    }
  }
  return statusHtml;
};


export const closePopup = () => {
  $(".popup").remove();
  $(".overlay").removeClass("active");
};
functions.closePopup = () => {
  $(".popup").remove();
  $(".overlay").removeClass("active");
};
export default functions;
