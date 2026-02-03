import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import pagination from "../../Shared/Pagination";

let rejectedViolations = {};
// rejectedViolations.pageIndex=1
rejectedViolations.dataObj = {
    destroyTable: false,
    ViolationSector: 0,
    ViolationType: 0,
}

rejectedViolations.getRejectedViolations = () => {
    let request = {
      Data: {
        RowsPerPage: 10,
        PageIndex: pagination.currentPage,
        ColName: "created",
        SortOrder: "desc",
        Status: "Rejected",
        ViolationType: rejectedViolations.dataObj.ViolationType,
        SectorConfigId: rejectedViolations.dataObj.ViolationSector,
        GlobalSearch: $("#violationSearch").val(),
      },
    };
    functions.requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search", {request,})
    .then((response) => {
        if (response.ok) {
            return response.json();
        }
    })
    .then((data) => {
        $(".PreLoader").removeClass("active");
        let RunningViolation = [];
        let ItemsData = data.d.Result;
        if (data.d.Result.GridData != null){
            if (data.d.Result.GridData.length > 0) {
                Array.from(data.d.Result.GridData).forEach((element) => {
                    RunningViolation.push(element);
                });
            } else {
                RunningViolation = [];
            }
        }
        rejectedViolations.setPaginations(ItemsData.TotalPageCount,ItemsData.RowsPerPage)
        rejectedViolations.rejectedViolationTable(RunningViolation);
        rejectedViolations.dataObj.destroyTable = true
        // rejectedViolations.pageIndex = ItemsData.CurrentPage
    })
    .catch((err) => {
        console.log(err);
    });
};

rejectedViolations.setPaginations=(TotalPages,RowsPerPage)=>{
    pagination.draw("#paginationID",TotalPages,RowsPerPage)
    pagination.start("#paginationID", rejectedViolations.getRejectedViolations)
    pagination.activateCurrentPage()
}

rejectedViolations.rejectedViolationTable = (RunningViolation) => {
    let data = [];
    let taskViolation;
    if (RunningViolation.length > 0) {
        RunningViolation.forEach(record => {
            taskViolation = record.Violation
            let createdDate =functions.getFormatedDate(record.Created);
            if(taskViolation != null){ 
                data.push([
                    `<div class="violationId" data-taskid="${record.ID}" data-violationid="${record.ViolationId}" data-offendertype="${taskViolation.OffenderType}" data-rejectreason="${record.Comment}">${taskViolation.ViolationCode}</div>`,
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
                    `<div class="violationCode">${taskViolation.OffenderType == "Vehicle" ? taskViolation.CarNumber:taskViolation.QuarryCode != ""?taskViolation.QuarryCode:"---"}</div>`,
                    `<div class="companyName">${taskViolation.ViolatorCompany != ""?taskViolation.ViolatorCompany:"-"}</div>`,
                    `<div class="violationType" data-typeid="${taskViolation.OffenderType == "Quarry"?taskViolation.ViolationTypes.ID:0}">${functions.getViolationArabicName(taskViolation.OffenderType, taskViolation?.ViolationTypes?.Title)}</div>`,
                    `<div class="violationZone">${taskViolation.ViolationsZone}</div>`,
                    `${functions.getFormatedDate(taskViolation.ViolationDate)}`,
                    `${functions.getFormatedDate(taskViolation.Created)}`,
                    
                ]);
            }
        });
    }
    functions.getCurrentUserActions();
    let Table = functions.tableDeclare(
        "#RejectedViolation",data,[
            { title: "رقم المخالفة" },
            { title: "", class: "all" },
            { title: "تصنيف المخالفة" },
            { title: "رقم المحجر/العربة" },
            { title: "إسم الشركة المخالفة" },
            { title: "نوع المخالفة " },
            { title: "المنطقة" },
            { title: "تاريخ الضبط" },  
            { title: "تاريخ الإنشاء" },  
        ],false,
        rejectedViolations.dataObj.destroyTable,
        "المخالفات المرفوضة.xlsx",
        "المخالفات المرفوضة"
    );
    $(".ellipsisButton").on("click", (e)=>{
        $(".hiddenListBox").hide(300);
        $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
     });
    let violationlog = Table.rows().nodes().to$();
    $.each(violationlog, (index, record) => {
        let jQueryRecord = $(record);
        let violationTaskID = jQueryRecord.find(".violationId").data("taskid");
        let rejectReason = jQueryRecord.find(".violationId").data("rejectreason");
        let OffenderType = jQueryRecord.find(".violationId").data("offendertype");
        let hiddenListBox = jQueryRecord.find(".controls").children(".hiddenListBox")
        if(hiddenListBox.height() > 110 && jQueryRecord.is(":nth-last-child(-n + 4)")){
            hiddenListBox.addClass("toTopDDL")
        }
        jQueryRecord.find(".controls").children(".hiddenListBox").find(".itemDetails").on("click", (e) => {
            $(".overlay").addClass("active");
            rejectedViolations.findViolationByID(e,violationTaskID);
        });
        jQueryRecord.find(".controls").children(".hiddenListBox").find(".printViolationDetails").on("click", (e) => {
          rejectedViolations.findViolationByID(e,violationTaskID ,true);  
        });
    });
    functions.hideTargetElement(".controls", ".hiddenListBox");
};

rejectedViolations.findViolationByID = (e,violationTaskID,print=false) => {
    let request = {
      Id: violationTaskID,
    };
    functions
      .requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/FindbyId",request)
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
            rejectReason=data.d.Comment;
            violationData = data.d.Violation;
            violationOffenderType= violationData.OffenderType
            if(violationOffenderType == "Quarry"){
                Content = DetailsPopup.quarryDetailsPopupContent(violationData,"المرفوضة");
                printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
            }else{
                Content = DetailsPopup.vehicleDetailsPopupContent(violationData,"المرفوضة");
                printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
                let VehcleType = violationData.VehicleType
                if(VehcleType == "عربة بمقطورة"){
                    $(".TrailerNumberBox").show()
                    } else{
                    $(".TrailerNumberBox").hide()
                    }
            }
            functions.declarePopup(["generalPopupStyle", "detailsPopup"],printBox);
            if(print){
              functions.PrintDetails(e)
            }
            $(".printBtn").on("click",(e)=>{
                functions.PrintDetails(e)
            })
            $(".detailsPopupForm").addClass("rejectedViolations")
            $(".rejectReasonBox").show().find(".rejectReason").val(rejectReason)
        } else {
          violationData = null;
        }
      })
      .catch((err) => {
        console.log(err);
      });
};

rejectedViolations.filterViolationsLog = (e) => {
    // let pageIndex = rejectedViolations.pageIndex
    let ViolationSectorVal  = $("#violationSector").children("option:selected").val();
    let ViolationTypeVal = $("#TypeofViolation").children("option:selected").data("id");
    // let ViolationType;
    // let ViolationSector;
  
    if (ViolationTypeVal == "" && ViolationSectorVal == "") {
      functions.warningAlert("من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث");
    } 
    else if( ViolationSectorVal != "" ||  ViolationTypeVal != "0"){
      $(".PreLoader").addClass("active");
      rejectedViolations.dataObj.ViolationSector = Number($("#violationSector").children("option:selected").val());
      rejectedViolations.dataObj.ViolationType = Number($("#TypeofViolation").children("option:selected").data("id"));
      rejectedViolations.dataObj.destroyTable = true;
      rejectedViolations.dataObj.pageIndex = pagination.currentPage
      rejectedViolations.getRejectedViolations();
    }
};


export default rejectedViolations;