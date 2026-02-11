import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import pagination from "../../Shared/Pagination";
import moment from "moment";

let ExternalViolationLog = {
    pageIndex: 1,
    destroyTable: false
};

/* =========================
   API
========================= */
ExternalViolationLog.getExternalViolations = ({
    pageIndex = pagination.currentPage || 1,
    destroyTable = false,
    CaseNumber = $("#caseNumber").val(),
    ViolationCode = $("#violationCode").val(),
    CreatedFrom = $("#createdFrom").val()
        ? moment($("#createdFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
        : null,
    CreatedTo = $("#createdTo").val()
        ? moment($("#createdTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
        : null
} = {}) => {

    let request = {
        Data: {
            RowsPerPage: 10,
            PageIndex: pageIndex,
            ColName: "created",
            SortOrder: "desc",
            ViolationCode,
            CaseNumber,
            IsExternalRecord: true,
            Status: "ExternalReviewed",
            CreatedFrom,
            CreatedTo,
        }
    };

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search",
            { request }
        )
        .then(res => res.ok ? res.json() : null)
        .then(data => {
            $(".PreLoader").removeClass("active");
            if (!data?.d?.Result) return;

            let result = data.d.Result;
            let records = result.GridData || [];
            ExternalViolationLog.setPaginations(
                result.TotalPageCount,
                result.RowsPerPage
            );

            ExternalViolationLog.renderTable(records, destroyTable);
            ExternalViolationLog.pageIndex = result.CurrentPage;
            // functions.getCurrentUserActions();
        })
        .catch(console.error);
};

/* =========================
   Pagination
========================= */
ExternalViolationLog.setPaginations = (TotalPages, RowsPerPage) => {
    pagination.draw("#paginationID", TotalPages, RowsPerPage);
    pagination.start("#paginationID", (page) => {
        ExternalViolationLog.getExternalViolations({ pageIndex: page });
    });
    pagination.activateCurrentPage();
};

ExternalViolationLog.renderTable = (records) => {
    if ($.fn.DataTable.isDataTable("#ExternalViolationLog")) {
        $("#ExternalViolationLog").DataTable().clear().destroy();
    }

    let data = [];

    records.forEach(record => {
        let v = record.Violation;
        if (!v) return;

        data.push([
            `<div class="violationId"
                data-taskid="${record.ID}"
                data-violationid="${v.ID}"
                data-offendertype="${v.OffenderType}"
                data-violationcode="${v.ViolationCode}"
                data-casenumber="${v.CaseNumber}">
                ${v.ViolationCode || "---"}
            </div>`,

            `<div class="controls">
                <div class="ellipsisButton">
                    <i class="fa-solid fa-ellipsis-vertical"></i>
                </div>
                <div class="hiddenListBox">
                    <div class="arrow"></div>
                    <ul class="list-unstyled controlsList">
                        <li>
                            <a href="#" class="itemDetails">المزيد من التفاصيل</a>
                        </li>
                    </ul>
                </div>
            </div>`,

            `<div>${functions.getViolationArabicName(v.OffenderType)}</div>`,
            `<div>${v.CaseNumber || "---"}</div>`,
            `<div>${v.ViolatorCompany || "-"}</div>`,
            `<div>${functions.getViolationArabicName(
                v.OffenderType,
                v?.ViolationTypes?.Title
            )}</div>`,
            `<div>${v.AssignedProsecution || "---"}</div>`,
            `<div>${v.Governrates?.Title || "---"}</div>`
        ]);
    });

    let table = functions.tableDeclare(
        "#ExternalViolationLog",
        data,
        [
            { title: "رقم المخالفة" },
            { title: "", class: "all" },
            { title: "تصنيف المخالفة" },
            { title: "رقم القضية" },
            { title: "إسم الشركة المخالفة" },
            { title: "نوع المخالفة" },
            { title: "النيابة المختصة" },
            { title: "جهة الضبط" }
        ],
        false,
        false,
        "سجل المخالفات الخارجية.xlsx",
        "سجل المخالفات الخارجية"
    );

    ExternalViolationLog.bindTableEvents(table);
};
/* =========================
   Table Events
========================= */
ExternalViolationLog.bindTableEvents = (table) => {

    $(document)
        .off("click", ".ellipsisButton")
        .on("click", ".ellipsisButton", function () {
            $(".hiddenListBox").hide(200);
            $(this).siblings(".hiddenListBox").toggle(200);
        });

    $(document)
        .off("click", ".itemDetails")
        .on("click", ".itemDetails", function (e) {
            e.preventDefault();
            let taskID = $(this)
                .closest("tr")
                .find(".violationId")
                .data("taskid");

            $(".overlay").addClass("active");
            ExternalViolationLog.findViolationByID(taskID);
        });

    functions.hideTargetElement(".controls", ".hiddenListBox");
};

/* =========================
   Details Popup
========================= */
ExternalViolationLog.findViolationByID = (taskID) => {
    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/FindbyId",
            { Id: taskID }
        )
        .then(res => res.ok ? res.json() : null)
        .then(data => {
            let v = data?.d?.Violation;
            if (!v) return;

            let content;
            if (v.OffenderType === "Quarry")
                content = DetailsPopup.quarryDetailsPopupContent(v, "منظورة خارجياً");
            else if (v.OffenderType === "Vehicle")
                content = DetailsPopup.vehicleDetailsPopupContent(v, "منظورة خارجياً");
            else
                content = DetailsPopup.equipmentDetailsPopupContent(v, "منظورة خارجياً");

            functions.declarePopup(
                ["generalPopupStyle", "detailsPopup"],
                `<div class="printBox" id="printJS-form">${content}</div>`
            );

            $(".printBtn").on("click", functions.PrintDetails);
            $(".detailsPopupForm").addClass("externalViolations");
        })
        .catch(console.error);
};

/* =========================
   Filters
========================= */
ExternalViolationLog.filterExternalViolations = () => {
    let hasValue =
        $("#violationCode").val() ||
        $("#caseNumber").val() ||
        $("#createdFrom").val() ||
        $("#createdTo").val();

    if (!hasValue) {
        return functions.warningAlert(
            "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
        );
    }

    $(".PreLoader").addClass("active");
    pagination.reset();
    ExternalViolationLog.getExternalViolations({
        pageIndex: 1,
        destroyTable: true
    });
};

ExternalViolationLog.resetFilter = (e) => {
    e.preventDefault();
    $("#violationCode, #caseNumber, #createdFrom, #createdTo").val("");
    $(".PreLoader").addClass("active");
    pagination.reset();
    ExternalViolationLog.getExternalViolations({ destroyTable: true });
};

/* =========================
   Init
========================= */
/* =========================
   Init - REMOVE THIS SECTION or make it conditional
========================= */
// Remove or comment out this auto-execution:
// $(document).ready(() => {
//     $("#createdFrom, #createdTo").datepicker({
//         format: "dd-mm-yyyy",
//         autoclose: true,
//         todayHighlight: true,
//         language: "ar"
//     });
// 
//     $(".searchGreenBtn").on("click", ExternalViolationLog.filterExternalViolations);
//     $(".resetGreenBtn").on("click", ExternalViolationLog.resetFilter);
// 
//     $("#exportBtn").on("click", () => {
//         functions.exportDataTable({
//             tableSelector: "#ExternalViolationLog",
//             fileName: "سجل المخالفات الخارجية.xlsx",
//             sheetName: "سجل المخالفات الخارجية",
//             headers: [
//                 "رقم المخالفة",
//                 "تصنيف المخالفة",
//                 "رقم القضية",
//                 "إسم الشركة المخالفة",
//                 "نوع المخالفة",
//                 "النيابة المختصة",
//                 "جهة الضبط"
//             ],
//             ignoreLastColumns: 2,
//             onlyVisible: true,
//             rtl: true,
//             columnWidths: 25,
//         });
//     });
//     ExternalViolationLog.getExternalViolations(); // THIS IS WHAT'S BEING CALLED
// });

// Instead, export the initialization function
ExternalViolationLog.init = () => {
    $("#createdFrom, #createdTo").datepicker({
        format: "dd-mm-yyyy",
        autoclose: true,
        todayHighlight: true,
        language: "ar"
    });

    $(".searchGreenBtn").on("click", ExternalViolationLog.filterExternalViolations);
    $(".resetGreenBtn").on("click", ExternalViolationLog.resetFilter);

    $("#exportBtn").on("click", () => {
        functions.exportDataTable({
            tableSelector: "#ExternalViolationLog",
            fileName: "سجل المخالفات الخارجية.xlsx",
            sheetName: "سجل المخالفات الخارجية",
            headers: [
                "رقم المخالفة",
                "تصنيف المخالفة",
                "رقم القضية",
                "إسم الشركة المخالفة",
                "نوع المخالفة",
                "النيابة المختصة",
                "جهة الضبط"
            ],
            ignoreLastColumns: 2,
            onlyVisible: true,
            rtl: true,
            columnWidths: 25,
        });
    });

    ExternalViolationLog.getExternalViolations();
};

export default ExternalViolationLog;





