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

    // 🔹 create column selector
    functions.createColumnSelector(Table, "#columnSelector", 'green');

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
                        false
                    );
                });
        });
    });

    functions.hideTargetElement(".controls", ".hiddenListBox");
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

ExternalViolationLog.findViolationByID = (event, taskID, print = false) => {
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
            let violationData;
            let violationOffenderType;
            let Content;
            let printBox;
            let violationID;

            if (data != null) {
                violationData = data.d.Violation;
                violationID = data.d.ViolationId;
                violationOffenderType = violationData.OffenderType;

                if (violationOffenderType == "Quarry") {
                    Content = DetailsPopup.quarryDetailsPopupContent(
                        violationData,
                        "منظورة خارجياً"
                    );
                    printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
                    functions.declarePopup(
                        ["generalPopupStyle", "detailsPopup"],
                        printBox
                    );
                } else if (violationOffenderType == "Vehicle") {
                    Content = DetailsPopup.vehicleDetailsPopupContent(
                        violationData,
                        "منظورة خارجياً"
                    );
                    printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
                    functions.declarePopup(
                        ["generalPopupStyle", "detailsPopup"],
                        printBox
                    );

                    // Handle vehicle type for trailer
                    let VehcleType = violationData.VehicleType;
                    if (VehcleType == "عربة بمقطورة") {
                        $(".TrailerNumberBox").show();
                    } else {
                        $(".TrailerNumberBox").hide();
                    }
                } else if (violationOffenderType == "Equipment") {
                    Content = DetailsPopup.equipmentDetailsPopupContent(
                        violationData,
                        "منظورة خارجياً"
                    );
                    printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
                    functions.declarePopup(
                        ["generalPopupStyle", "detailsPopup"],
                        printBox
                    );
                }

                // Add class to identify this popup
                $(".popupForm").addClass("Externalform");

                // Hide/show appropriate sections based on context
                $(".totalPriceBox").show().find(".dateLimitBox").hide();
                $(".confirmationAttachBox").show();
                $(".Externalform").find(".addConfirmationAttchBox").hide();
                $(".Externalform").find(".rejectReasonBox").hide();
                $(".Externalform").find(".showFormula").hide();

                // Handle print functionality
                if (print) {
                    $(".Externalform").find(".confirmationAttachBox").show();
                    functions.PrintDetails(event);
                }

                $(".printBtn").on("click", (e) => {
                    functions.PrintDetails(e);
                });

                $(".detailsPopupForm").addClass("externalTasks");

                // Get attachments if needed
                DetailsPopup.getConfirmationAttachments(taskID);
            } else {
                violationData = null;
            }
        })
        .catch((err) => {
            console.log(err);
        });
};

export default ExternalViolationLog;





