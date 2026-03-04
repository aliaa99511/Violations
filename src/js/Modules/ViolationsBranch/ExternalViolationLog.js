import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import pagination from "../../Shared/Pagination";

let ExternalViolationLog = {
    pageIndex: 1,
    destroyTable: false
};

ExternalViolationLog.getExternalViolations = (
    pageIndex = 1,
    destroyTable = false,
) => {
    let request = {
        Data: {
            RowsPerPage: 10,
            PageIndex: pagination.currentPage,
            ColName: "created",
            SortOrder: "desc",
            IsExternalRecord: true,
            Status: "ExternalReviewed",
            CaseNumber: $("#caseNumber").val(),
            ViolationCode: $("#violationCode").val(),
            CreatedFrom: $("#createdFrom").val()
                ? moment($("#createdFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
                : null,
            CreatedTo: $("#createdTo").val()
                ? moment($("#createdTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
                : null,
        }
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
            let ExternalViolationDate = [];
            let ItemsData = data.d.Result;
            if (data.d.Result.GridData != null) {
                if (data.d.Result.GridData.length > 0) {
                    Array.from(data.d.Result.GridData).forEach((element) => {
                        ExternalViolationDate.push(element);
                    });
                } else {
                    ExternalViolationDate = [];
                }
            }

            ExternalViolationLog.setPaginations(ItemsData.TotalPageCount, ItemsData.RowsPerPage);
            ExternalViolationLog.ExternalViolationTable(ExternalViolationDate, destroyTable);
            ExternalViolationLog.pageIndex = ItemsData.CurrentPage;
            functions.getCurrentUserActions();
        })
        .catch((err) => {
            console.log(err);
        });
};

ExternalViolationLog.setPaginations = (TotalPages, RowsPerPage) => {
    pagination.draw("#paginationID", TotalPages, RowsPerPage);
    pagination.start("#paginationID", ExternalViolationLog.getExternalViolations);
    pagination.activateCurrentPage();
};
ExternalViolationLog.filterExternalViolations = () => {
    let pageIndex = ExternalViolationLog.pageIndex;

    $(".PreLoader").addClass("active");
    ExternalViolationLog.getExternalViolations(
        pageIndex,
        true
    );
};

ExternalViolationLog.resetFilter = (e) => {
    e.preventDefault();
    $("#caseNumber").val("");
    $("#violationCode").val("");
    $("#createdFrom").val("");
    $("#createdTo").val("");

    $(".PreLoader").addClass("active");
    pagination.reset();
    ExternalViolationLog.getExternalViolations();
};
ExternalViolationLog.ExternalViolationTable = (ExternalViolationDate, destroyTable) => {
    let data = [];

    if (ExternalViolationDate.length > 0) {
        ExternalViolationDate.forEach(record => {
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
    }

    if (ExternalViolationLog.destroyTable || destroyTable) {
        $("#ExternalViolationLog").DataTable().destroy();
    }

    let Table = functions.tableDeclare(
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
    ExternalViolationLog.destroyTable = true;

    $(".ellipsisButton").on("click", (e) => {
        $(".hiddenListBox").hide(300);
        $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
    });
    let violationlog = Table.rows().nodes().to$();
    let UserId = _spPageContextInfo.userId;
    functions.callSharePointListApi("Configurations").then((Users) => {
        let UserDetails = null;
        let UsersData = Users.value;
        UsersData.forEach((User) => {
            if (User.UserIdId.find((id) => id == UserId)) {
                UserDetails = User;
            }
        });

        $.each(violationlog, (index, record) => {
            let jQueryRecord = $(record);
            let taskID = jQueryRecord.find(".violationId").data("taskid");
            let hiddenListBox = jQueryRecord
                .find(".controls")
                .children(".hiddenListBox");

            if (
                violationlog.length > 4 &&
                hiddenListBox.height() > 110 &&
                jQueryRecord.is(":nth-last-child(-n + 4)")
            ) {
                hiddenListBox.addClass("toTopDDL");
            }

            jQueryRecord
                .find(".controls")
                .children(".hiddenListBox")
                .find(".itemDetails")
                .on("click", (e) => {
                    $(".overlay").addClass("active");
                    ExternalViolationLog.findViolationByID(
                        e,
                        taskID,
                        false,
                        UserDetails ? UserDetails.JobTitle1 : ""
                    );
                });
        });
    });

    functions.hideTargetElement(".controls", ".hiddenListBox");

    // ExternalViolationLog.bindTableEvents(table);
};

// ExternalViolationLog.bindTableEvents = (table) => {

//     $(document)
//         .off("click", ".ellipsisButton")
//         .on("click", ".ellipsisButton", function () {
//             $(".hiddenListBox").hide(200);
//             $(this).siblings(".hiddenListBox").toggle(200);
//         });

//     $(document)
//         .off("click", ".itemDetails")
//         .on("click", ".itemDetails", function (e) {
//             e.preventDefault();
//             let taskID = $(this)
//                 .closest("tr")
//                 .find(".violationId")
//                 .data("taskid");

//             $(".overlay").addClass("active");
//             ExternalViolationLog.findViolationByID(taskID);
//         });

//     functions.hideTargetElement(".controls", ".hiddenListBox");
// };

ExternalViolationLog.findViolationByID = (
    event,
    taskID,
    print = false,
    UserJopTitle = ""
) => {
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

export default ExternalViolationLog;





