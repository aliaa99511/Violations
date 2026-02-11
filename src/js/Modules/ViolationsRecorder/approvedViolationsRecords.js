import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import pagination from "../../Shared/Pagination";

let approvedViolationsRecords = {};
// approvedViolationsRecords.pageIndex = 1;
approvedViolationsRecords.dataObj = {
  destroyTable: false,
  OffenderType: "",
  ViolationType: 0,
}

approvedViolationsRecords.getViolations = () => {
  let UserId = _spPageContextInfo.userId;
  let request = {
    Data: {
      RowsPerPage: 10,
      PageIndex: pagination.currentPage,
      ColName: "created",
      SortOrder: "desc",
      Status: "Approved",
      Sector: 0,
      ViolationType: approvedViolationsRecords.dataObj.ViolationType,
      OffenderType: approvedViolationsRecords.dataObj.OffenderType,
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
      approvedViolationsRecords.setPaginations(ItemsData.TotalPageCount, ItemsData.RowsPerPage);
      approvedViolationsRecords.dashBoardTable(violationsData);
      approvedViolationsRecords.dataObj.destroyTable = true;
      // approvedViolationsRecords.pageIndex = ItemsData.CurrentPage;
    })
    .catch((err) => {
      console.log(err);
    });
};
approvedViolationsRecords.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", approvedViolationsRecords.getViolations);
  // pagination.reset()
  // pagination.scrollToElement(el, length)
  pagination.activateCurrentPage();
};
approvedViolationsRecords.dashBoardTable = (violationsData) => {
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
        `<div class="violationArName">${functions.getViolationArabicName(taskViolation.OffenderType)}</div>`,
        `<div class="violationCode">${taskViolation.OffenderType == "Vehicle" ? taskViolation.CarNumber : taskViolation.QuarryCode != "" ? taskViolation.QuarryCode : "---"}</div>`,
        `<div class="companyName">${taskViolation.ViolatorCompany != "" ? taskViolation.ViolatorCompany : "-"}</div>`,
        `<div class="violationType" data-typeid="${taskViolation.OffenderType == "Quarry" ? taskViolation.ViolationTypes.ID : 0}">${functions.getViolationArabicName(taskViolation.OffenderType, taskViolation?.ViolationTypes?.Title)}</div>`,
        `<div class="violationZone">${taskViolation.ViolationsZone}</div>`,
        `${functions.getFormatedDate(taskViolation.ViolationDate)}`,
        `${createdDate}`,


      ]);
    });
  }
  let Table = functions.tableDeclare(
    "#approvedViolationsRecords",
    data,
    [
      { title: "رقم المخالفة", class: "no-sort" },
      { title: "", class: "all no-sort" },
      { title: "تصنيف المخالفة", class: "no-sort" },
      { title: " رقم المحجر/العربة", class: "no-sort" },
      { title: "إسم الشركة المخالفة", class: "no-sort" },
      { title: "نوع المخالفة ", class: "no-sort" },
      { title: "المنطقة", class: "no-sort" },
      { title: "تاريخ الضبط", class: "sort" },
      { title: "تاريخ الإنشاء", class: "sort" },
    ],
    false,
    approvedViolationsRecords.dataObj.destroyTable,
    "سجل المحاضر الموافق عليها.xlsx",
    "سجل المحاضر الموافق عليها"
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
      approvedViolationsRecords.findViolationByID(e, taskID);
    });
    jQueryRecord.find(".controls").children(".hiddenListBox").find(".printViolationDetails").on("click", (e) => {
      $(".overlay").addClass("active");
      approvedViolationsRecords.findViolationByID(e, taskID, true);
    });
  });
  functions.hideTargetElement(".controls", ".hiddenListBox");
};
approvedViolationsRecords.findViolationByID = (event, taskID, print = false) => {
  let request = {
    Id: taskID,
  };
  functions.requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/FindbyId", request)
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
          Content = DetailsPopup.quarryDetailsPopupContent(violationData, "الموافق عليها");
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(["generalPopupStyle", "detailsPopup", "blueHeaderPopup"], printBox);
        } else if (violationOffenderType == "Vehicle") {
          Content = DetailsPopup.vehicleDetailsPopupContent(violationData, "الموافق عليها");
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(["generalPopupStyle", "detailsPopup", "blueHeaderPopup"], printBox);
          let vehicleType = violationData.VehicleType;
          if (vehicleType == "عربة بمقطورة") {
            $(".TrailerNumberBox").show();
          } else {
            $(".TrailerNumberBox").hide();
          }
        } else if (violationOffenderType == "Equipment") {
          Content = DetailsPopup.equipmentDetailsPopupContent(violationData, "الموافق عليها");
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(["generalPopupStyle", "detailsPopup", "blueHeaderPopup"], printBox);
        }
        $(".detailsPopupForm").addClass("approvedViolationsRecordsLog")
        // $(".approvedViolationsRecordsLog").find(".CommiteeMembersBox").show().find(".formElements").css("border-bottom","none")

        $(".printBtn").on("click", (e) => {
          functions.PrintDetails(e)
        })

        if (print) {
          functions.PrintDetails(event)
        }
      } else {
        violationData = null;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};
approvedViolationsRecords.filterViolationsLog = (e) => {
  // let pageIndex = approvedViolationsRecords.pageIndex;
  let OffenderTypeVal = $("#violationCategory").children("option:selected").val();
  let ViolationTypeVal = $("#TypeofViolation").children("option:selected").data("id");
  // let ViolationType;
  // let offenderType;

  if (ViolationTypeVal == "" && OffenderTypeVal == "") {
    functions.warningAlert(
      "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
    );
  } else if (OffenderTypeVal != "" || ViolationTypeVal != "0") {
    $(".PreLoader").addClass("active");
    approvedViolationsRecords.dataObj.OffenderType = $("#violationCategory").children("option:selected").val();
    approvedViolationsRecords.dataObj.ViolationType = Number($("#TypeofViolation").children("option:selected").data("id"));
    approvedViolationsRecords.dataObj.destroyTable = true;
    approvedViolationsRecords.dataObj.pageIndex = pagination.currentPage
    approvedViolationsRecords.getViolations();
  }
};

export default approvedViolationsRecords;
