import bootpopup from "../Libraries/bootpopup";
import Swal from "sweetalert2";
import printJS from "print-js";
const functions = {};

functions.setUserDetailsSideMenu = (UserType, UserJop, UserSector = "") => {
  $(".userDetails").find(".userName").text(UserJop);
  if (UserType == "RecorderSector") {
    $(".userDetails")
      .find(".userSector")
      .text("( " + UserSector + " )");
    $(".userDetails").find(".userName").css("margin-bottom", "0.75rem");
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
        "')/items",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: (data) => {
        if (data != null) {
          resolve(data);
        } else {
          resolve([]);
        }
      },
      error: (xhr) => {
        console.log(xhr.responseText);
      },
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
  destroyTable = false
) => {
  let tableOptions = {
    dom: "t<'Tablepaginate'p>",
    responsive: true,
    fixedColumns: true,
    pageLength: 10,
    data: tableData,
    paging: showPaging,
    ordering: true,
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
functions.warningAlert = (Message, Selector = null, modal = true) => {
  Swal.fire({
    icon: "warning",
    title: "حدث خطأ ما",
    text: Message,
    confirmButtonText: "إغلاق",
    customClass: "sweetStyle",
  }).then(() => {
    if (Selector != null && modal == true) {
      $(".modal").animate(
        {
          scrollTop: $(Selector).offset().top,
        },
        400
      );
    } else if (Selector != null && modal == false) {
      // $(window).scrollTop($(Selector).offset().top)
      $(window).animate(
        {
          scrollTop: $(Selector).offset().top,
        },
        2000
      );
    }
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
functions.inputDateFormat = (input, startDate = "", endDate = "") => {
  $(input).datepicker({
    format: "mm-dd-yyyy",
    todayHighlight: true,
    startDate: startDate,
    endDate: endDate,
    autoclose: true,
  });
};
functions.getFormatedDate = (unForamttedDate, format = "MM-DD-YYYY") => {
  let localDate = new Date(
    Number(
      unForamttedDate.substring(
        unForamttedDate.indexOf("(") + 1,
        unForamttedDate.lastIndexOf(")")
      )
    )
  ).toLocaleString();
  let formatedDate = moment(localDate).format(format);
  return formatedDate;
};
functions.getViolationArabicName = (OffenderType) => {
  let violationArType = "-";
  if (OffenderType == "Quarry") {
    violationArType = "محجر مخالف";
  } else {
    violationArType = "عربة مخالفة";
  }
  return violationArType;
};
functions.redirectUser = () => {
  let UserId = _spPageContextInfo.userId;
  functions.callSharePointListApi("Configurations").then((Users) => {
    let UsersData = Users.value;
    UsersData.forEach((User) => {
      if (User.UserIdId == UserId) {
        switch (User.JobTitle1) {
          case "القائم بالضبط": {
            window.location.href =
              _spPageContextInfo.siteAbsoluteUrl + "/ViolationsRecorder";
            break;
          }
          case "فرع المخالفات": {
            window.location.href =
              _spPageContextInfo.siteAbsoluteUrl + "/ViolationsBranch";
            break;
          }
          case "رئيس القطاع": {
            window.location.href =
              _spPageContextInfo.siteAbsoluteUrl + "/SectorManager";
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
      "/Style Library/MiningViolations/CSS/main.css",
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
  let currentMonth = dateFun.getMonth() + 1;
  let currentYear = dateFun.getFullYear();
  last_n_Days =
    "0" + currentMonth + "/0" + (today - NumberOfDays) + "/" + currentYear;
  console.log(last_n_Days);
  return last_n_Days;
};
functions.isNumberKey = (e) => {
  let charCode = e.which ? e.which : e.keyCode;
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    return false;
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
  console.log(InputVal);
  // if(InputVal != " " && InputVal != "" && splitedEnteredValue.length >= nameCount){
  //   splitedEnteredValue.forEach(word=>{
  //     console.log("word",word)
  //     console.log("splitedEnteredValue",splitedEnteredValue)
  //     // if(word != ""){
  //       if(word[0] != ""){
  //         console.log(word[0])
  //         // console.log(word[0].length)
  //         if(word[1] != ""){
  //           console.log(word[1])
  //           // console.log(word[1].length)
  //           if(word[2] != ""){
  //             console.log(word[2])
  //             // console.log(word[2].length)
  //             validName = true
  //           }else {
  //             validName = false
  //           }
  //         }else {
  //           validName = false
  //         }
  //       }else {
  //         validName = false
  //       }
  //     // }else{
  //     //   validName = false
  //     // }
  //   })
  // }
  // console.log(InputVal)
  // console.log(splitedEnteredValue)
  // console.log(validName)
  return validName;
};

export default functions;
