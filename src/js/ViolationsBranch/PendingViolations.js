import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import pagination from "../../Shared/Pagination";
import confirmPopup from "../../Shared/confirmationPopup";

let PendingViolations = {};
PendingViolations.pageIndex = 1;

PendingViolations.getPendingViolations = (
  pageIndex = 1,
  destroyTable = false,
  ViolationZone = "",
  ViolationType = 0
) => {
  let request = {
    Data: {
      RowsPerPage: 10,
      PageIndex: Number(pageIndex),
      ColName: "created",
      SortOrder: "desc",
      Status: "Pending",
      PaymentStatus: "",
      ViolationType: ViolationType,
      ViolationsZone: ViolationZone,
    },
  };
  functions
    .requester("_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search", {
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
      let Pendingviolation = [];
      let ItemsData = data.d.Result;
      if (data.d.Result.GridData != null) {
        if (data.d.Result.GridData.length > 0) {
          Array.from(data.d.Result.GridData).forEach((element) => {
            Pendingviolation.push(element);
          });
        } else {
          Pendingviolation = [];
        }
      }
      PendingViolations.setPaginations(
        ItemsData.TotalPageCount,
        ItemsData.RowsPerPage
      );
      PendingViolations.PendingviolationTable(Pendingviolation, destroyTable);
      PendingViolations.pageIndex = ItemsData.CurrentPage;
    })
    .catch((err) => {
      console.log(err);
    });
};

PendingViolations.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", PendingViolations.getPendingViolations);
  // pagination.reset()
  // pagination.scrollToElement(el, length)
  pagination.activateCurrentPage();
};

PendingViolations.PendingviolationTable = (Pendingviolation, destroyTable) => {
  let data = [];
  let taskViolation;
  if (Pendingviolation.length > 0) {
    Pendingviolation.forEach((record) => {
      taskViolation = record.Violation;
      data.push([
        `<div class="violationId" data-taskid="${record.ID}" data-violationid="${taskViolation.ID}" data-offendertype=${taskViolation.OffenderType} data-violationcode="${taskViolation.ViolationCode}">${taskViolation.ViolationCode}</div>`,
        `<div class="violationArName">${functions.getViolationArabicName(
          taskViolation.OffenderType
        )}</div>`,
        `<div class="violationCode" data-offendertype="${
          taskViolation.OffenderType
        }">${
          taskViolation.OffenderType == "Quarry"
            ? taskViolation.QuarryCode
            : taskViolation.CarNumber
        }</div>`,
        `<div class="companyName">${taskViolation.ViolatorCompany}</div>`,
        `<div class="violationType" data-typeid="${taskViolation.ViolationTypes.ID}">${taskViolation.ViolationTypes.Title}</div>`,
        `<div class="violationZone">${taskViolation.ViolationsZone}</div>`,
        `${functions.getFormatedDate(taskViolation.ViolationDate)}`,
        `<div class='controls'>
            <div class='ellipsisButton'>
                <i class='fa-solid fa-ellipsis-vertical'></i>
            </div>
            <div class="hiddenListBox">
                <div class='arrow'></div>
                <ul class='list-unstyled controlsList'>
                    <li><a href="#" class="itemDetails">المزيد من التفاصيل</a></li>
                    <li><a href="#" class="printViolationDetails">طباعة التقرير</a></li>
                    <li><a href="#" class="ApprovedViolation"">قبول المخالفة</a></li> 
                    <li><a href="#" class="RejectedViolations">رفض المخالفة</a></li>   
                </ul>
            </div>
        </div`,
      ]);
    });
  }
  let Table = functions.tableDeclare(
    "#PendingViolation",
    data,
    [
      { title: "رقم المخالفة" },
      { title: "تصنيف المخالفة" },
      { title: " رقم المحجر/العربة" },
      { title: "إسم الشركة المخالفة" },
      { title: "نوع المخالفة " },
      { title: "المنطقة" },
      { title: "تاريخ الضبط" },
      { title: "", class: "all" },
    ],
    false,
    destroyTable
  );
  $(".ellipsisButton").on("click", (e) => {
    $(".hiddenListBox").hide(300);
    $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
  });
  let violationlog = Table.rows().nodes().to$();
  $.each(violationlog, (index, record) => {
    let jQueryRecord = $(record);
    let taskID = jQueryRecord.find(".violationId").data("taskid");
    let violationId = jQueryRecord.find(".violationId").data("violationid");
    let violationCode = jQueryRecord.find(".violationId").data("violationcode");
    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".itemDetails")
      .on("click", (e) => {
        $(".overlay").addClass("active");
        PendingViolations.findViolationByID(e, taskID);
      });
    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".ApprovedViolation")
      .on("click", (e) => {
        $(".overlay").addClass("active");
        confirmPopup.updateTaskStatusPopup(taskID, violationCode, "Approve");
      });
    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".RejectedViolations")
      .on("click", (e) => {
        $(".overlay").addClass("active");
        PendingViolations.RejectTaskPopup(violationCode, taskID);
      });
    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".printViolationDetails")
      .on("click", (e) => {
        $(".overlay").addClass("active");
        PendingViolations.findViolationByID(e, taskID, true);
        functions.PrintDetails(e);
      });
  });

  functions.hideTargetElement(".controls", ".hiddenListBox");
};

PendingViolations.findViolationByID = (event, taskID, print = false) => {
  let request = {
    Id: taskID,
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
      console.log(data);
      console.log("wwww", data.d.Violation);
      let violationData;
      let violationOffenderType;
      let Content;
      let printBox;
      if (data != null) {
        violationData = data.d.Violation;
        violationOffenderType = violationData.OffenderType;
        if (violationOffenderType == "Quarry") {
          Content = DetailsPopup.quarryDetailsPopupContent(
            violationData,
            "قيد الانتظار"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup"],
            printBox
          );
        } else {
          Content = DetailsPopup.quarryDetailsPopupContent(
            violationData,
            "قيد الانتظار"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
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

        $(".printBtn").on("click", (e) => {
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

PendingViolations.RejectTaskPopup = (violationCode, taskID) => {
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
                            <div class="col-12">
                                <div class="form-group customFormGroup">
                                    <label for="rejectReason" class="customLabel">سبب الرفض</label>
                                    <textarea class="form-control rejectReason customTextArea" id="rejectReason" placeholder="ادخل سبب الرفض"></textarea>
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
                            <div class="btnStyle confirmBtnGreen popupBtn confirmEdit" id="RejectBtn">تأكيد</div>
                            <div class="btnStyle cancelBtn popupBtn closeRejectPopup" id="closeRejectPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
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

  $("#RejectBtn").on("click", (e) => {
    e.preventDefault();
    let rejectComment = $("#rejectReason").val();
    if (rejectComment != "") {
      $(".overlay").addClass("active");
      PendingViolations.RejectTaskAction(taskID, rejectComment);
      // $("#RejectBtn").attr("data-dismiss", "modal");
    } else {
      functions.warningAlert("من فضلك قم بإدخال سبب الرفض أولا");
    }
  });
};

PendingViolations.RejectTaskAction = (taskID, rejectComment) => {
  let request = {
    Data: {
      Title: "تم رفض المخالفة",
      PaymentStatus: "قيد الإنتطار",
      Status: "Rejected",
      ID: taskID,
      Comment: rejectComment,
    },
  };
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
      $(".overlay").removeClass("active");
      functions.sucessAlert("تم رفض المخالفة");
    })
    .catch((err) => {
      console.log(err);
    });
};

PendingViolations.filterViolationsLog = (e) => {
  let pageIndex = PendingViolations.pageIndex;
  let ViolationZoneVal = $("#violationZone").children("option:selected").val();
  let ViolationTypeVal = $("#TypeofViolation")
    .children("option:selected")
    .data("id");
  let ViolationType;
  let ViolationZone;

  if (ViolationTypeVal == "" && ViolationZoneVal == "") {
    functions.warningAlert(
      "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
    );
  } else if (ViolationZoneVal != "" || ViolationTypeVal != "0") {
    $(".PreLoader").addClass("active");
    ViolationZone = $("#violationZone").children("option:selected").val();
    ViolationType = Number(
      $("#TypeofViolation").children("option:selected").data("id")
    );
    PendingViolations.getPendingViolations(
      pageIndex,
      true,
      ViolationZone,
      ViolationType
    );
  }
};
export default PendingViolations;
