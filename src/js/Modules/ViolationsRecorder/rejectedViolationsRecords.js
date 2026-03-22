import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import pagination from "../../Shared/Pagination";

let rejectedViolationsRecords = {};
rejectedViolationsRecords.pageIndex = 1;
rejectedViolationsRecords.destroyTable = false;

rejectedViolationsRecords.getViolations = (
  pageIndex = 1,
  destroyTable = false,
  ViolationType = Number($("#TypeofViolation").children("option:selected").data("id")),
  ViolationGeneralSearch = ""
) => {
  let UserId = _spPageContextInfo.userId;

  let request = {
    Data: {
      RowsPerPage: 10,
      PageIndex: pagination.currentPage,
      ColName: "created",
      SortOrder: "desc",
      Status: "Rejected",
      Sector: UserId,
      ViolationType: ViolationType,
      GlobalSearch: $("#violationSearch").val(),
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
      rejectedViolationsRecords.setPaginations(ItemsData.TotalPageCount, ItemsData.RowsPerPage)
      rejectedViolationsRecords.dashBoardTable(violationsData, destroyTable);
      rejectedViolationsRecords.pageIndex = ItemsData.CurrentPage;
      functions.getCurrentUserActions();
    })
    .catch((err) => {
      console.log(err);
    });
};
rejectedViolationsRecords.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", rejectedViolationsRecords.getViolations);
  pagination.activateCurrentPage();
};
rejectedViolationsRecords.dashBoardTable = (violationsData, destroyTable) => {
  let data = [];
  let taskViolation;
  // let violationData;

  if (violationsData.length > 0) {
    violationsData.forEach(record => {
      taskViolation = record.Violation;
      let createdDate = functions.getFormatedDate(record.Created);
      let editLink;
      if (taskViolation.OffenderType == "Quarry") {
        editLink = "/ViolationsRecorder/Pages/quarryViolationForm.aspx?taskId=" + record.ID
      } else if (taskViolation.OffenderType == "Vehicle") {
        editLink = "/ViolationsRecorder/Pages/CarViolationForm.aspx?taskId=" + record.ID
      } else {
        editLink = "/ViolationsRecorder/Pages/EquipmentViolationForm.aspx?taskId=" + record.ID
      }
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
                        <li><a href="${editLink}" class=""> تعديل المخالفة</a></li>
                     
                    </ul>
                </div>
            </div>`,
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

  if (rejectedViolationsRecords.destroyTable || destroyTable) {
    $("#rejectedViolationsRecords").DataTable().destroy();
  }
  let Table = functions.tableDeclare(
    "#rejectedViolationsRecords",
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
    false,
    "سجل المحاضر المرفوضة.xlsx",
    "سجل المحاضر المرفوضة"
  );

  // 🔹 create column selector
  functions.createColumnSelector(Table, "#columnSelector", 'blue');

  rejectedViolationsRecords.destroyTable = true;

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

    jQueryRecord.find(".controls").children(".hiddenListBox").find(".itemDetails").on("click", (e) => {
      $(".overlay").addClass("active");
      rejectedViolationsRecords.findViolationByID(e, taskID);
    });
    jQueryRecord.find(".controls").children(".hiddenListBox").find(".printViolationDetails").on("click", (e) => {
      $(".overlay").addClass("active");
      rejectedViolationsRecords.findViolationByID(e, taskID, true);
    });
  });
  functions.hideTargetElement(".controls", ".hiddenListBox");
};
rejectedViolationsRecords.findViolationByID = (event, taskID, print = false) => {
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
      let rejectReason;
      if (data != null) {
        rejectReason = data.d.Comment;
        violationData = data.d.Violation;
        violationOffenderType = violationData.OffenderType;
        if (violationOffenderType == "Quarry") {
          Content = DetailsPopup.quarryDetailsPopupContent(violationData, "المرفوضة");
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
        } else if (violationOffenderType == "Vehicle") {
          Content = DetailsPopup.vehicleDetailsPopupContent(violationData, "المرفوضة");
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          let vehicleType = violationData.VehicleType;
          if (vehicleType == "عربة بمقطورة") {
            $(".TrailerNumberBox").show();
          } else {
            $(".TrailerNumberBox").hide();
          }
        } else if (violationOffenderType == "Equipment") {
          Content = DetailsPopup.equipmentDetailsPopupContent(violationData, "المرفوضة");
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
        }
        functions.declarePopup(["generalPopupStyle", "detailsPopup", "blueHeaderPopup"], printBox);
        $(".printBtn").on("click", (e) => {
          functions.PrintDetails(e)
        })
        if (print) {
          functions.PrintDetails(event)
        }
        $(".detailsPopupForm").addClass("rejectedViolationsRecordsLog")
        $(".detailsPopupForm").find(".CommiteeMembersBox").show().find(".formElements").css("border-bottom", "none")
        $(".rejectReasonBox").show().find(".rejectReason").val(rejectReason)
      } else {
        violationData = null;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};
rejectedViolationsRecords.filterViolationsLog = (e) => {
  let pageIndex = rejectedViolationsRecords.pageIndex
  let ViolationTypeVal = $("#TypeofViolation").children("option:selected").data("id");
  let ViolationGeneralSearch = $("#violationSearch").val();

  let ViolationType;

  if (
    ViolationTypeVal == "" &&
    ViolationGeneralSearch == ""
  ) {
    functions.warningAlert(
      "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
    );
  } else if (
    ViolationTypeVal != "0" ||
    ViolationGeneralSearch != ""
  ) {
    $(".PreLoader").addClass("active");
    ViolationType = Number($("#TypeofViolation").children("option:selected").data("id"));
    rejectedViolationsRecords.getViolations(
      pageIndex,
      true,
      ViolationType,
      ViolationGeneralSearch
    );
  }
};
rejectedViolationsRecords.resetFilter = (e) => {
  e.preventDefault();
  $("#TypeofViolation").val("0");
  $("#violationSearch").val("");

  $(".PreLoader").addClass("active");
  pagination.reset();
  rejectedViolationsRecords.getViolations();
};


export default rejectedViolationsRecords;