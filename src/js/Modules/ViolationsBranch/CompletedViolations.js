
import DetailsPopup from "../../Shared/detailsPopupContent";
import functions from "../../Shared/functions";


import pagination from "../../Shared/Pagination";

let completedViolations = {};

completedViolations.pageIndex = 1;

completedViolations.getCompletedLog = (pageIndex = 1, destroyTable = false, ViolationSector = 0, ViolationType = 0) => {
    let request = {
        Data: {
            RowsPerPage: 20,
            PageIndex: Number(completedViolations.pageIndex),
            ColName: "created",
            SortOrder: "desc",
            Status: "Completed",
            PaymentStatus: "",
            ViolationType: ViolationType,
            SectorConfigId: ViolationSector,
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
            $(".PreLoader").removeClass("active");
            let CompletedViolation = [];
            let ItemsData = data.d.Result;

            if (data.d.Result.GridData != null) {
                if (data.d.Result.GridData.length > 0) {
                    Array.from(data.d.Result.GridData).forEach((element) => {
                        CompletedViolation.push(element);
                    });
                } else {
                    CompletedViolation = [];
                }
            }

            completedViolations.setPaginations(ItemsData.TotalPageCount, ItemsData.RowsPerPage);
            completedViolations.CompletedViolationTable(CompletedViolation, destroyTable);
            completedViolations.pageIndex = ItemsData.CurrentPage;
        })
        .catch((err) => {
            console.log(err);
        });
};

completedViolations.setPaginations = (TotalPages, RowsPerPage) => {
    pagination.draw("#paginationID", TotalPages, RowsPerPage);
    pagination.start("#paginationID", completedViolations.getCompletedLog);
    // pagination.reset()
    // pagination.scrollToElement(el, length)
    pagination.activateCurrentPage();
};


completedViolations.CompletedViolationTable = (CompletedViolation, destroyTable) => {
    let data = [];
    let taskViolation;

    if (CompletedViolation.length > 0) {
        CompletedViolation.forEach((record) => {
            taskViolation = record.Violation;

            let taskViolationID = `${functions.checkApisResponse(taskViolation) ? taskViolation.ID : "-"}`;
            let taskViolationCode = `${functions.checkApisResponse(taskViolation) ? taskViolation.ViolationCode : "-"}`;
            let OffenderType = `${functions.checkApisResponse(taskViolation) ? taskViolation.OffenderType : "-"}`;
            let QuarryCode = `${functions.checkApisResponse(taskViolation) ? taskViolation.QuarryCode : "-"}`;
            let CarNumber = `${functions.checkApisResponse(taskViolation) ? taskViolation.CarNumber : "-"}`;
            let ViolationsZone = `${functions.checkApisResponse(taskViolation) ? taskViolation.ViolationsZone : "-"}`;
            let ViolatorCompany = `${functions.checkApisResponse(taskViolation) ? taskViolation.ViolatorCompany : "-"}`;
            let ViolationTypes = `${functions.checkApisResponse(taskViolation) ? taskViolation.ViolationTypes : "-"}`;
            let ViolationDate = `${functions.checkApisResponse(taskViolation) ? taskViolation.ViolationDate : "-"}`;

            data.push([
                `<div class="violationId" data-violationid="${taskViolationID}" data-taskid="${record.ID}" data-violationcode="${taskViolationCode}" data-offendertype="${OffenderType}">${taskViolationCode != "" ? taskViolationCode : "-"}</div>`,
                `<div class="violationArName">${functions.getViolationArabicName(OffenderType)}</div>`,
                `<div class="violationCode" >${OffenderType == "Quarry" ? QuarryCode : CarNumber}</div>`,
                `<div class="companyName">${ViolatorCompany != "" ? ViolatorCompany : "-"}</div>`,
                `<div class="violationType" data-typeid="${OffenderType == "Quarry" ? ViolationTypes.ID : 0}">${OffenderType == "Quarry" && ViolationTypes != null ? ViolationTypes.Title : "-"}</div>`,
                `<div class="violationZone">${ViolationsZone != "" ? ViolationsZone : "-"}</div>`,
                `${ViolationDate != "" ? functions.getFormatedDate(ViolationDate) : "-"}`,

                `<div class= 'controls'>
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
            ]);
        });
    }
    let Table = functions.tableDeclare(
        "#oldViolation",
        data,
        [
            { title: "رقم المخالفة" },
            { title: "تصنيف المخالفة" },
            { title: "رقم المحجر/العربة" },
            { title: "إسم الشركة المخالفة" },
            { title: "نوع المخالفة " },
            { title: "المنطقة" },
            { title: "تاريخ الضبط" },
            { title: "", class: "all" },
        ],
        false,
        destroyTable,
        "سجل القضايا.xlsx",
        "سجل القضايا"
    );

    let violationlog = Table.rows().nodes().to$();
    $.each(violationlog, (index, record) => {
        let jQueryRecord = $(record);
        let taskID = jQueryRecord.find(".violationId").data("taskid");
        let violationId = jQueryRecord.find(".violationId").data("violationid");
        let violationCode = jQueryRecord.find(".violationId").data("violationcode");
        let OffenderType = jQueryRecord.find(".violationId").data("offendertype");

        jQueryRecord.find(".controls").children(".ellipsisButton").on("click", (e) => {
            $(".hiddenListBox").hide(300);
            $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
        });

        jQueryRecord.find(".controls").children(".hiddenListBox").find(".itemDetails").on("click", (e) => {
            $(".overlay").addClass("active");
            completedViolations.findViolationByID(e, taskID);
        });

        // jQueryRecord.find(".controls").children(".hiddenListBox").find(".printViolationDetails").on("click", (e) => {
        //     $(".overlay").addClass("active");
        //     completedViolations.findViolationByID(e, taskID, true)
        // });
    });
    functions.hideTargetElement(".controls", ".hiddenListBox");
};
completedViolations.findViolationByID = (event, violationTaskID, print = false) => {
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
            let violationData;
            let violationOffenderType;
            let Content;
            let printBox;
            if (data != null) {
                violationData = data.d.Violation;
                violationOffenderType = violationData.OffenderType;
                if (violationOffenderType == "Quarry") {
                    Content = DetailsPopup.quarryDetailsPopupContent(violationData, "القائمة");
                    printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
                    functions.declarePopup(["generalPopupStyle", "detailsPopup"], printBox);
                } else if(violationOffenderType == "Vehicle") {
                    Content = DetailsPopup.vehicleDetailsPopupContent(violationData, "القائمة");
                    printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
                    functions.declarePopup(["generalPopupStyle", "detailsPopup"], printBox);
                    let VehcleType = violationData.VehicleType;
                    if (VehcleType == "عربة بمقطورة") {
                        $(".TrailerNumberBox").show();
                    } else {
                        $(".TrailerNumberBox").hide();
                    }
                }else if(violationOffenderType == "Equipment"){
                    Content = DetailsPopup.equipmentDetailsPopupContent(violationData, "القائمة");
                    printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
                    functions.declarePopup(["generalPopupStyle", "detailsPopup"], printBox);
                }
                $(".printBtn").on("click", (e) => {
                    functions.PrintDetails(e);
                });
                if (print) {
                    // $(".modal").modal("toggle")
                    // $(".modal").hide()
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

completedViolations.filterCompletedLog = (e) => {
    let pageIndex = completedViolations.pageIndex;
    let ViolationSectorVal = $("#violationSector").children("option:selected").val();
    let ViolationTypeVal = $("#TypeofViolation").children("option:selected").data("id");
    let ViolationType;
    let ViolationSector;

    if (ViolationTypeVal == "" && ViolationSectorVal == "") {
        functions.warningAlert(
            "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
        );
    } else if (ViolationSectorVal != "" || ViolationTypeVal != "0") {
        $(".PreLoader").addClass("active");
        ViolationSector = Number($("#violationSector").children("option:selected").val());
        ViolationType = Number($("#TypeofViolation").children("option:selected").data("id"));
        completedViolations.getCompletedLog(pageIndex, true, ViolationSector, ViolationType);
    }
};


// // Abdelrahman
// var selectedViolationId;
// var selectedViolationCode;
// var trackHistoryTable;
// $(".contentContainer").on('click', ".violationHistory", function () {
//     selectedViolationId = $(this).data('violationid');
//     selectedViolationCode = $(this).data('violationcode');
// })


// $('.track-history-modal').on('shown.bs.modal', function () {
//     $('.track-history-modal').removeClass('generalPopupStyle detailsPopup')
//     $(".modal-violation-code").text(selectedViolationCode)
//     let request = {
//         "Request": {
//             ViolationId: selectedViolationId,
//         }

//     }
//     // Datatable section
//     const columns = ["id", "status", "created", "createdBy", "comment"]
//     trackHistoryTable = ajaxDatatableHistoryInit($("#trackHistoryTable"), "http://dev-web-sp19:29978/_layouts/15/Uranium.Violations.SharePoint/ViolationHistoryLogs.aspx/Search", request, columns)
// })
// $('.track-history-modal').on('hidden.bs.modal', function () {
//     trackHistoryTable.destroy();
//     $("#trackHistoryTable tbody").empty()
//     $(".modal-violation-code").text('')

// })
// export default completedViolations;
export default completedViolations;
