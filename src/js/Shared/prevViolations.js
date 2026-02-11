import functions from "./functions";
import DetailsPopup from "./detailsPopupContent";
import pagination from "./Pagination";

let prevViolations = {};
// prevViolations.pageIndex = 1;
prevViolations.dataObj = {
  destroyTable: false,
  ViolatorName: "",
  NationalID: "",
  CarNumber: "",
  ViolatorCompany: "",
  CommercialRegister: "",
  QuarryCode: "",
  ViolationCode: "",
}

prevViolations.getViolations = () => {
  let request = {
    Data: {
      RowsPerPage: 10,
      PageIndex: pagination.currentPage,
      ColName: "created",
      SortOrder: "desc",
      Status: "",
      ViolatorName: prevViolations.dataObj.ViolatorName,
      NationalID: prevViolations.dataObj.NationalID,
      CarNumber: prevViolations.dataObj.CarNumber,
      ViolatorCompany: prevViolations.dataObj.ViolatorCompany,
      CommercialRegister: prevViolations.dataObj.CommercialRegister,
      ViolationCode: prevViolations.dataObj.ViolationCode,
      QuarryCode: prevViolations.dataObj.QuarryCode,
    },
  };
  functions.requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search", { request })
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
      $(".prevVioltionsCountBox").find(".prevViolationCount").text(ItemsData.TotalRowCount)

      prevViolations.setPaginations(ItemsData.TotalPageCount, ItemsData.RowsPerPage);
      prevViolations.dashBoardTable(violationsData);
      prevViolations.dataObj.destroyTable = true
      // prevViolations.pageIndex = ItemsData.CurrentPage;
    })
    .catch((err) => {
      console.log(err);
    });
};

prevViolations.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", prevViolations.getViolations);
  // pagination.reset()
  // pagination.scrollToElement(el, length)
  pagination.activateCurrentPage();
};
prevViolations.getViolationStatus = (ViolationStatus) => {
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
                <span class="statusText">قيد انتظار السداد</span>
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
    default: {
      statusHtml = `<div class="statusBox pendingStatus">
                <i class="statusIcon fa-regular fa-question-circle"></i>
                <span class="statusText">${ViolationStatus || "---"}</span>
            </div>`;
      break;
    }
  }

  return statusHtml;
};
prevViolations.dashBoardTable = (violationsData = []) => {
  let data = [];
  let taskViolation;
  // let violationData;
  if (violationsData.length > 0) {
    violationsData.forEach(record => {
      taskViolation = record.Violation;
      let createdDate = functions.getFormatedDate(record.Created);
      data.push([
        `<div class="violationId" data-violationid="${record.ViolationId}" data-taskid="${record.ID}" data-offendertype="${taskViolation.OffenderType}">${taskViolation.ViolationCode}</div>`,
        `<div class='controls'>
                <div class='ellipsisButton'>
                    <i class='fa-solid fa-ellipsis-vertical'></i>
                </div>
                <div class="hiddenListBox">
                    <div class='arrow'></div>
                    <ul class='list-unstyled controlsList'>
                        <li><a href="#" class="itemDetails"> المزيد من التفاصيل</a></li>
                    </ul>
                </div>
            </div`,
        `<div class="violationArName">${prevViolations.getViolationStatus(record.Status)}</div>`,
        // `<div class="violationArName">${functions.getViolationArabicName(taskViolation.OffenderType)}</div>`,
        `<div class="violationCode">${taskViolation.OffenderType == "Vehicle" ? taskViolation.CarNumber : taskViolation.QuarryCode != "" ? taskViolation.QuarryCode : "---"}</div>`,
        `<div class="companyName">${taskViolation.ViolatorCompany != "" ? taskViolation.ViolatorCompany : "-"}</div>`,
        `<div class="violationType" data-typeid="${taskViolation.ViolationTypes != null ? taskViolation.ViolationTypes.ID : 0}">${functions.getViolationArabicName(taskViolation.OffenderType, taskViolation?.ViolationTypes?.Title)}</div>`,
        `<div class="violationZone">${taskViolation.Governrates.Sector}</div>`,
        `<div class="violationZone">${createdDate}</div>`,
        // `<div class="violationZone">${taskViolation.ViolationsZone}</div>`,
        `${functions.getFormatedDate(taskViolation.ViolationDate)}`,

      ]);
      // <li><a href="#" class="printViolationDetails"> طباعة التقرير</a></li>
    });
  }
  let Table = functions.tableDeclare(
    "#prevViolationsQueryTable",
    data,
    [
      { title: "رقم المخالفة", class: "no-sort" },
      { title: "", class: "all no-sort" },
      { title: "حالة المخالفة", class: "no-sort" },
      { title: " رقم المحجر/العربة", class: "no-sort" },
      { title: "إسم الشركة المخالفة", class: "no-sort" },
      { title: "نوع المخالفة ", class: "no-sort" },
      { title: "القطاع", class: "no-sort" },
      { title: "تاريخ الضبط", class: "sort" },
      { title: "تاريخ الإنشاء", class: "sort" },
    ],
    false,
    prevViolations.dataObj.destroyTable,
    "سجل المخالفات السابقة.xlsx",
    "سجل المخالفات السابقة"
  );
  $(".ellipsisButton").on("click", (e) => {
    $(".hiddenListBox").hide(300);
    $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
  });

  let violationlog = Table.rows().nodes().to$();
  $.each(violationlog, (index, record) => {
    let jQueryRecord = $(record);
    let taskID = jQueryRecord.find(".violationId").data("taskid");

    jQueryRecord.find(".controls").children(".hiddenListBox").find(".itemDetails").on("click", (e) => {
      $(".overlay").addClass("active");
      prevViolations.findViolationByID(e, taskID);
    });
    jQueryRecord.find(".controls").children(".hiddenListBox").find(".printViolationDetails").on("click", (e) => {
      $(".overlay").addClass("active");
      prevViolations.findViolationByID(e, taskID, true);
    });
  });
  functions.hideTargetElement(".controls", ".hiddenListBox");
};
prevViolations.findViolationByID = (event, taskID, print = false) => {
  let request = {
    Id: taskID,
  };
  functions.requester(
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
      if (data != null) {
        violationData = data.d.Violation;
        violationOffenderType = violationData.OffenderType;
        if (violationOffenderType == "Quarry") {
          Content = DetailsPopup.quarryDetailsPopupContent(violationData, "المسجلة");
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
        } else if (violationOffenderType == "Vehicle") {
          Content = DetailsPopup.vehicleDetailsPopupContent(violationData, "المسجلة");
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          let vehicleType = violationData.VehicleType;
          if (vehicleType == "مقطورة") {
            $(".TrailerNumberBox").show();
          } else {
            $(".TrailerNumberBox").hide();
          }
        } else if (violationOffenderType == "Equipment") {
          Content = DetailsPopup.equipmentDetailsPopupContent(violationData, "المسجلة");
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
        }
        functions.declarePopup(["generalPopupStyle", "detailsPopup", functions.getSiteName() == "ViolationsRecorder" ? "blueHeaderPopup" : ""], printBox);
        $(".printBtn").on("click", (e) => {
          functions.PrintDetails(e)
        })
        if (print) {
          functions.PrintDetails(event)
        }
        $(".detailsPopupForm").addClass("registredViolationsLog")
        $(".detailsPopupForm").find(".CommiteeMembersBox").show().find(".formElements").css("border-bottom", "none")
      } else {
        violationData = null;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};
prevViolations.filterViolationsLog = (e) => {
  let isValid = false
  // let pageIndex = prevViolations.pageIndex;
  let ViolatorName = $(".filterBox").find("#violatorName").val();
  let NationalID = $(".filterBox").find("#violatorNationalId").val();
  let CarNumber = $(".filterBox").find("#violatorCarNumber").val();
  let ViolatorCompany = $(".filterBox").find("#companyName").val();
  let CommercialRegister = $(".filterBox").find("#commercialRegister").val();
  let QuarryCode = $(".filterBox").find("#quarryCode").val();
  let NationalIdRegExp = /^(2|3)[0-9][0-9][0-1][0-9][0-3][0-9](01|02|03|04|11|12|13|14|15|16|17|18|19|21|22|23|24|25|26|27|28|29|31|32|33|34|35|88)\d\d\d\d\d$/;
  let ViolationCode = $("#violationCode").val();
  if (ViolatorName == "" && NationalID == "" && CarNumber == "" && ViolatorCompany == "" && QuarryCode == "" && ViolationCode == "") {
    functions.warningAlert("من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث");
  }
  if (ViolatorName != "" || NationalID != "" || CarNumber != "" || ViolatorCompany != "" || QuarryCode != "" || ViolationCode != "") {
    // if (ViolatorName != "" || (NationalID != "" && NationalIdRegExp.test(NationalID)) || CarNumber != "" || ViolatorCompany != "" || CommercialRegister != "" || QuarryCode != "") {
    isValid = true
    $(".PreLoader").addClass("active");
    prevViolations.dataObj.ViolatorName = $(".filterBox").find("#violatorName").val();
    prevViolations.dataObj.NationalID = $(".filterBox").find("#violatorNationalId").val();
    prevViolations.dataObj.CarNumber = $(".filterBox").find("#violatorCarNumber").val();
    prevViolations.dataObj.ViolatorCompany = $(".filterBox").find("#companyName").val();
    prevViolations.dataObj.CommercialRegister = $(".filterBox").find("#commercialRegister").val();
    prevViolations.dataObj.QuarryCode = $(".filterBox").find("#quarryCode").val();
    prevViolations.dataObj.ViolationCode = $(".filterBox").find("#violationCode").val();
    prevViolations.dataObj.destroyTable = true;
    prevViolations.dataObj.pageIndex = pagination.currentPage
    prevViolations.getViolations()
  } else {
    isValid = false
    functions.warningAlert("من فضلك أدخل جميع بيانات البحث بشكل صحيح");
  }
};

export default prevViolations;
