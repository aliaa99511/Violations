import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import confirmPopup from "../../Shared/confirmationPopup";
import pagination from "../../Shared/Pagination";

let quarryViolationReferral = {};
quarryViolationReferral.pageIndex = 1;
quarryViolationReferral.destroyTable = false;

quarryViolationReferral.getQuarryViolationReferrals = (
    pageIndex = 1,
    destroyTable = false,
    // ReferralNumber = $("#CaseNumber").val(),
    // CaseStatus = $("#CaseStatus").children("option:selected").val(),
) => {
    // Remove Arabic & English letters from Referral Number filter
    $("#CaseNumber").on("input", function () {
        let value = $(this).val();

        // Remove English and Arabic letters only
        value = value.replace(/[a-zA-Z\u0600-\u06FF]/g, "");

        $(this).val(value);
    });

    let request = {
        Request: {
            RowsPerPage: 10,
            PageIndex: pagination.currentPage,
            ColName: "created",
            SortOrder: "desc",
            QuarryCode: $("#theCode").val(),
            ViolationCode: $("#violationCode").val(),
            ViolationStatus: $("#ViolationStatus").children("option:selected").val(),
            ReferralNumber: $("#CaseNumber").val(),
            Status: $("#CaseStatus").children("option:selected").val(),
            OffenderType: "Quarry",
            RefferedDateFrom: $("#RefferedDateFrom").val()
                ? moment($("#RefferedDateFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
                : null,
            RefferedDateTo: $("#RefferedDateTo").val()
                ? moment($("#RefferedDateTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
                : null,
        }
    };
    $(".overlay").addClass("active");
    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/Search",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            $(".overlay").removeClass("active");
            let Referrals = [];
            let ItemsData = data?.d?.Result;

            if (data?.d?.Result?.GridData != null) {
                if (data.d.Result.GridData.length > 0) {
                    Array.from(data.d.Result.GridData).forEach((element) => {
                        Referrals.push(element);
                    });
                } else {
                    Referrals = [];
                }
            }

            quarryViolationReferral.setPaginations(ItemsData.TotalPageCount, ItemsData.RowsPerPage);
            quarryViolationReferral.QuarryViolationReferralTable(Referrals, destroyTable);
            quarryViolationReferral.pageIndex = ItemsData.CurrentPage;
        })
        .catch((err) => {
            $(".overlay").removeClass("active");
            console.log(err);
        });
};
quarryViolationReferral.setPaginations = (TotalPages, RowsPerPage) => {
    pagination.draw("#paginationID", TotalPages, RowsPerPage);
    pagination.start("#paginationID", quarryViolationReferral.getQuarryViolationReferrals);
    pagination.activateCurrentPage();
};
quarryViolationReferral.filterQuarryViolationReferrals = (e) => {
    let pageIndex = quarryViolationReferral.pageIndex;

    $(".overlay").addClass("active");
    quarryViolationReferral.getQuarryViolationReferrals(
        pageIndex,
        true,
    );
    // let pageIndex = quarryViolationReferral.pageIndex;

    // let ReferralNumberVal = $("#CaseNumber").val();
    // let CaseStatusVal = $("#CaseStatus").children("option:selected").val();

    // let ReferralNumber;
    // let CaseStatus;

    // if (
    //     ReferralNumberVal == "" &&
    //     CaseStatusVal == ""
    // ) {
    //     functions.warningAlert("من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث");
    // } else if (
    //     ReferralNumberVal != "" ||
    //     CaseStatusVal != ""
    // ) {
    //     $(".overlay").addClass("active");
    //     ReferralNumber = $("#CaseNumber").val();
    //     CaseStatus = $("#CaseStatus").children("option:selected").val();
    //     quarryViolationReferral.getQuarryViolationReferrals(
    //         pageIndex,
    //         true,
    //         ReferralNumber,
    //         CaseStatus,
    //     );
    // }
};
quarryViolationReferral.resetFilter = (e) => {
    e.preventDefault();

    // Clear all filter inputs
    $("#CaseNumber").val("");
    $("#CaseStatus").val(""); // This will reset to the first option
    $("#ViolationStatus").val("");
    $("#theCode").val("");
    $("#violationCode").val("");
    $("#RefferedDateFrom").val("");
    $("#RefferedDateTo").val("");

    // $("#CaseStatus").val("قيد انتظار تأشيرات النيابة");

    $(".overlay").addClass("active");
    pagination.reset();
    quarryViolationReferral.getQuarryViolationReferrals();
};
quarryViolationReferral.exportToExcel = () => {
    const currentFilters = {
        RowsPerPage: 10000000,
        PageIndex: 1,
        ColName: "created",
        SortOrder: "desc",
        QuarryCode: $("#theCode").val(),
        ViolationCode: $("#violationCode").val(),
        ViolationStatus: $("#ViolationStatus").children("option:selected").val(),
        ReferralNumber: $("#CaseNumber").val(),
        Status: $("#CaseStatus").children("option:selected").val(),
        OffenderType: "Quarry",
        RefferedDateFrom: $("#RefferedDateFrom").val()
            ? moment($("#RefferedDateFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
            : null,
        RefferedDateTo: $("#RefferedDateTo").val()
            ? moment($("#RefferedDateTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
            : null,
    };

    const columns = [
        {
            title: "رقم المخالفة",
            render: (record) => record.ViolationCode || "-----",
        },
        {
            title: "",
            skip: true // control column
        },
        {
            title: "تاريخ الإحالة",
            render: (record) => functions.getFormatedDate(record.RefferedDate),
        },
        {
            title: "رقم الإحالة",
            data: "ReferralNumber",
        },
        {
            title: "المبلغ المستحق",
            render: (record) => record.TotalPriceDue || 0,
        },
        {
            title: "حالة المخالفة",
            render: (record) =>
                functions.getQuarryViolationStatus(record.ViolationStatus) || "-----",
        },
        {
            title: "موقف الإحالة",
            render: (record) =>
                functions.getCaseStatus(record.Status) || "-----",
        },
    ];

    functions.exportCasesFromAPI({
        searchUrl: "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/Search",
        requestData: { Request: currentFilters },
        columns,
        fileName: "سجل إحالات المخالفات المحجرية.xlsx",
        sheetName: "سجل إحالات المخالفات المحجرية",
        columnWidths: 25,
        rtl: true,
        dataPath: "d.Result.GridData",
        exportButtonSelector: "#exportBtn",
        tableSelector: "#QuarryViolationReferralTable"
    });
};
quarryViolationReferral.QuarryViolationReferralTable = (Referrals, destroyTable) => {
    let data = [];

    if (quarryViolationReferral.destroyTable || destroyTable) {
        $("#QuarryViolationReferralTable").DataTable().destroy();
    }

    if (Referrals && Referrals.length > 0) {
        Referrals.forEach((referral) => {
            let violation = referral?.Violation;
            let refferedDate = functions.getFormatedDate(referral.RefferedDate);
            let violationStatus = referral.ViolationStatus || "";
            let caseStatus = referral.Status || "";
            let referralNumber = referral.ReferralNumber || "";
            let caseNumber = referral.CaseNumber || "";
            let ReferredAmount = referral.ReferredAmount || 0;

            // Determine which actions to show based on business rules
            let hasAddReferralNumberAction = false;
            let hasPayCaseBeforeEditAction = false;
            let hasPayCaseAfterEditAction = false;
            let hasSaveCaseAction = false;
            let canShowDetailsOnly = false;
            let hasEditViolationAmountAction = false;
            let hasEditReferralAmountAction = false;

            // Business Rule 1: Add Referral Number
            if (!referralNumber &&
                caseStatus == "قيد انتظار رقم الإحالة" &&
                violationStatus == "UnderReview") {
                hasAddReferralNumberAction = true;
            }

            // Business Rule 3: Pay Case Before Edit (سداد على نموذج التقييم)
            if (
                (caseStatus == "قيد انتظار تأشيرات النيابة" ||
                    caseStatus == "قيد الانتظار القطاع" ||
                    caseStatus == "قيد انتظار رقم الإحالة"
                ) &&
                violationStatus == "UnderReview"
            ) {
                hasPayCaseBeforeEditAction = true;
            }

            // Business Rule 4: Pay Case After Edit (سداد على الإحالة)
            if (referralNumber &&
                caseStatus == "تم التسليم للتحريات" &&
                violationStatus == "UnderReview") {
                hasPayCaseAfterEditAction = true;
            }

            // Business Rule 5: Save Case
            if (violationStatus !== "Paid" &&
                (caseStatus === "قيد انتظار رقم الإحالة" ||
                    caseStatus === "قيد انتظار تأشيرات النيابة" ||
                    caseStatus === "قيد الانتظار القطاع" ||
                    caseStatus === "تم التسليم للتحريات")) {
                hasSaveCaseAction = true;
            }

            // Business Rule 6: Paid - show details only
            if (violationStatus == "Paid") {
                canShowDetailsOnly = true;
            }

            // Business Rule 7: Edit Amount Actions (تعديل مبلغ المخالفة / تعديل مبلغ الإحالة)
            if (caseStatus !== "محفوظة" && violationStatus !== "Cancelled") {
                if (caseStatus === "تم التسليم للتحريات") {
                    hasEditReferralAmountAction = true;
                } else {
                    hasEditViolationAmountAction = true;
                }
            }

            // Build actions menu HTML without data attributes
            let actionsMenuHTML = '';
            if (canShowDetailsOnly) {
                actionsMenuHTML = `
                    <ul class='list-unstyled controlsList'>
                        <li><a href="#" class="itemDetails">المزيد من التفاصيل</a></li>
                        <li><a href="#" data-violationid="${referral?.ViolationId}" data-violationcode="${referral?.ViolationCode}" class="violationHistory" data-toggle="modal" data-target="#trackHistoryModal">تتبع مرحلة المخالفة</a></li>
                </ul>`;
            } else {
                actionsMenuHTML = `
                <ul class='list-unstyled controlsList'>
                    <li><a href="#" class="itemDetails">المزيد من التفاصيل</a></li>
                    <li><a href="#" data-violationid="${referral?.ViolationId}" data-violationcode="${referral?.ViolationCode}" class="violationHistory" data-toggle="modal" data-target="#trackHistoryModal">تتبع مرحلة المخالفة</a></li>`;

                if (hasAddReferralNumberAction) {
                    actionsMenuHTML += `
                        <li><a href="#" class="addReferralNumberAction">إضافة رقم الإحالة</a></li>`;
                }

                if (hasPayCaseBeforeEditAction) {
                    actionsMenuHTML += `
                    <li><a href="#" class="payCaseBeforeEditAction">سداد على نموذج التقييم</a></li>`;
                }

                if (hasPayCaseAfterEditAction) {
                    actionsMenuHTML += `
                    <li><a href="#" class="payCaseAfterEditAction">سداد على الإحالة</a></li>`;
                }

                // Edit Amount actions
                if (hasEditViolationAmountAction) {
                    actionsMenuHTML += `
                    <li><a href="#" class="editViolationAmountAction">تعديل مبلغ المخالفة</a></li>`;
                }

                if (hasEditReferralAmountAction) {
                    actionsMenuHTML += `
                    <li><a href="#" class="editReferralAmountAction">تعديل مبلغ الإحالة</a></li>`;
                }

                if (hasSaveCaseAction) {
                    actionsMenuHTML += `
                    <li><a href="#" class="saveCaseAction">حفظ وإلغاء قرار النيابة</a></li>`;
                }

                actionsMenuHTML += `</ul>`;
            }

            let displayViolationStatus = functions.getQuarryViolationStatus(violationStatus);

            // Prepare all data attributes in a single object
            const violationCodeData = {
                'referralid': referral.ID,
                'violationid': referral.ViolationId,
                'taskid': referral.TaskId,
                'referralstatus': referral.Status,
                'referralnumber': referral.ReferralNumber,
                'violationcode': referral.ViolationCode,
                'oldprice': referral?.TotalOldPrice || 0,
                'newprice': referral?.TotalPriceDue || 0,
                'referredamount': ReferredAmount,
                'offendertype': referral?.OffenderType,
                'casenumber': caseNumber,
                'violationstatus': violationStatus,
                'hasaddreferralnumber': hasAddReferralNumberAction,
                'haspaycasebeforeedit': hasPayCaseBeforeEditAction,
                'haspaycaseafteredit': hasPayCaseAfterEditAction,
                'hassavecase': hasSaveCaseAction,
                'canshowdetailsonly': canShowDetailsOnly,
                'totalprice': referral?.TotalPriceDue || 0,
                'totaloldprice': referral?.TotalOldPrice || 0,
            };

            // Convert data object to data-attributes string
            const dataAttributes = Object.entries(violationCodeData)
                .map(([key, value]) => `data-${key.toLowerCase()}="${value}"`)
                .join(' ');

            data.push([
                `<div class="violationCode noWrapContent" ${dataAttributes}>
                    ${referral.ViolationCode || "-----"}
                </div>`,
                `<div class='controls'>
                    <div class='ellipsisButton'>
                        <i class='fa-solid fa-ellipsis-vertical'></i>
                    </div>
                    <div class="hiddenListBox">
                        <div class='arrow'></div>
                        ${actionsMenuHTML}
                    </div>
                </div>`,
                `<div class="refferedDate noWrapContent">${refferedDate || "-----"}</div>`,
                `<div class="referralNumber">${referralNumber || "-----"}</div>`,
                `<div class="totalPriceDue">${functions.splitBigNumbersByComma(referral.TotalPriceDue || 0) || "-----"}</div>`,
                `<div class="violationStatus">${displayViolationStatus || "-----"}</div>`,
                `<div class="referralStatus">${functions.getCaseStatus(caseStatus)}</div>`,
                `<div class="referralAttachments caseAttachments"><a href="#!" style="color: black;">المرفقات</a></div>`,
            ]);
            // `<div class="referralStatus">${quarryViolationReferral.getCaseStatus(caseStatus)}</div>`,
        });
    } else {
        data.push([
            `<div class="no-data">لا توجد بيانات متاحة</div>`,
            "",
            "",
            "",
            "",
            "",
            "",
            ""
        ]);
    }

    let Table = functions.tableDeclare(
        "#QuarryViolationReferralTable",
        data,
        [
            { title: "رقم المخالفة" },
            { title: "", class: "all" },
            { title: "تاريخ الإحالة" },
            { title: "رقم الإحالة" },
            { title: "المبلغ المستحق" },
            { title: "حالة المخالفة" },
            { title: "موقف الإحالة" },
            { title: "المرفقات" },
        ],
        false,
        false,
        "سجل إحالات المخالفات المحجرية.xlsx",
        "سجل إحالات المخالفات المحجرية"
    );

    // 🔹 create column selector
    functions.createColumnSelector(Table, "#columnSelector", 'green');

    quarryViolationReferral.destroyTable = true;

    $("#exportBtn").off("click").on("click", () => {
        quarryViolationReferral.exportToExcel();
    });

    // $(".ellipsisButton").on("click", (e) => {
    //     $(".hiddenListBox").hide(300);
    //     $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
    // });

    let referralsLog = Table.rows().nodes().to$();

    $.each(referralsLog, (index, record) => {
        let jQueryRecord = $(record);
        let violationCodeElement = jQueryRecord.find(".violationCode");
        let referralID = violationCodeElement.data("referralid");
        let referralNumber = violationCodeElement.data("referralnumber");
        let hiddenListBox = jQueryRecord.find(".controls").children(".hiddenListBox");

        // Toggle menu
        jQueryRecord.find(".controls").children(".ellipsisButton").on("click", (e) => {
            e.stopPropagation();
            const currentBox = $(e.currentTarget).siblings(".hiddenListBox");
            $(".hiddenListBox").not(currentBox).stop(true, true).hide(300);
            currentBox.stop(true, true).toggle(300);
        });

        // Attachments click handler
        jQueryRecord.find(".referralAttachments").find("a").off('click').on('click', function (e) {
            e.preventDefault();
            $(".overlay").addClass("active");
            quarryViolationReferral.getReferralAttachmentsByReferralId(referralID, referralNumber);
        });

        // Details click handler
        jQueryRecord.find(".itemDetails").off('click').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            $(".overlay").addClass("active");
            quarryViolationReferral.FindReferralById(referralID);
            $(".hiddenListBox").hide(300);
        });

        // if (
        //     referralsLog.length > 4 &&
        //     hiddenListBox.height() > 110 &&
        //     jQueryRecord.is(":nth-last-child(-n + 4)")
        // ) {
        //     hiddenListBox.addClass("toTopDDL");
        // }

    });

    // Add Referral Number Action
    $(document).off('click', '.addReferralNumberAction').on('click', '.addReferralNumberAction', function (e) {
        e.preventDefault();
        e.stopPropagation();

        let $row = $(this).closest('tr');
        let $violationCode = $row.find('.violationCode');

        let referralId = $violationCode.data('referralid');
        let violationId = $violationCode.data('violationid');
        let taskId = $violationCode.data('taskid');
        let violationCode = $violationCode.data('violationcode');

        quarryViolationReferral.addReferralNumberPopup(referralId, violationId, violationCode, taskId);
        $(".hiddenListBox").hide(300);
    });

    // Pay Case Before Edit Action
    $(document).off('click', '.payCaseBeforeEditAction').on('click', '.payCaseBeforeEditAction', function (e) {
        e.preventDefault();
        e.stopPropagation();

        let $row = $(this).closest('tr');
        let $violationCode = $row.find('.violationCode');

        let referralId = $violationCode.data('referralid');
        let violationId = $violationCode.data('violationid');
        let taskId = $violationCode.data('taskid');
        let referralNumber = $violationCode.data('referralnumber');
        let violationCode = $violationCode.data('violationcode');
        let totalPrice = $violationCode.data('totalprice');

        quarryViolationReferral.payCaseBeforeEditPopup(
            referralId,
            violationId,
            taskId,
            referralNumber,
            violationCode,
            totalPrice
        );

        $(".hiddenListBox").hide(300);
    });

    // Pay Case After Edit Action
    $(document).off('click', '.payCaseAfterEditAction').on('click', '.payCaseAfterEditAction', function (e) {
        e.preventDefault();
        e.stopPropagation();

        let $row = $(this).closest('tr');
        let $violationCode = $row.find('.violationCode');

        let referralId = $violationCode.data('referralid');
        let violationId = $violationCode.data('violationid');
        let taskId = $violationCode.data('taskid');
        let referralNumber = $violationCode.data('referralnumber');
        let violationCode = $violationCode.data('violationcode');
        let totalPrice = $violationCode.data('totalprice');
        let oldPrice = $violationCode.data('oldprice');
        let referredAmount = $violationCode.data('referredamount');

        quarryViolationReferral.payCaseAfterEditPopup(
            referralId,
            violationId,
            taskId,
            referralNumber,
            violationCode,
            totalPrice,
            oldPrice,
            referredAmount
        );

        $(".hiddenListBox").hide(300);
    });

    // Save Case Action Handler
    $(document).off('click', '.saveCaseAction').on('click', '.saveCaseAction', function (e) {
        e.preventDefault();
        e.stopPropagation();

        let $row = $(this).closest('tr');
        let $violationCode = $row.find('.violationCode');

        let referralId = $violationCode.data('referralid');
        let violationId = $violationCode.data('violationid');
        let taskId = $violationCode.data('taskid');
        let referralNumber = $violationCode.data('referralnumber');
        let violationCode = $violationCode.data('violationcode');
        let caseStatus = $violationCode.data('referralstatus');

        quarryViolationReferral.saveCaseAndCancelViolationPopup(
            referralId,
            violationId,
            taskId,
            referralNumber,
            violationCode,
            caseStatus
        );

        $(".hiddenListBox").hide(300);
    });

    // Edit Violation Amount Action
    $(document).off('click', '.editViolationAmountAction').on('click', '.editViolationAmountAction', function (e) {
        e.preventDefault();
        e.stopPropagation();

        let $row = $(this).closest('tr');
        let $violationCode = $row.find('.violationCode');

        let referralId = $violationCode.data('referralid');
        let violationId = $violationCode.data('violationid');
        let taskId = $violationCode.data('taskid');
        let violationCode = $violationCode.data('violationcode');
        let currentAmount = $violationCode.data('totalprice');
        let referralNumber = $violationCode.data('referralnumber');

        quarryViolationReferral.editViolationAmountPopup(
            referralId,
            violationId,
            taskId,
            violationCode,
            referralNumber,
            currentAmount
        );

        $(".hiddenListBox").hide(300);
    });

    // Edit Referral Amount Action
    $(document).off('click', '.editReferralAmountAction').on('click', '.editReferralAmountAction', function (e) {
        e.preventDefault();
        e.stopPropagation();

        let $row = $(this).closest('tr');
        let $violationCode = $row.find('.violationCode');

        let referralId = $violationCode.data('referralid');
        let violationId = $violationCode.data('violationid');
        let taskId = $violationCode.data('taskid');
        let violationCode = $violationCode.data('violationcode');
        let currentReferredAmount = $violationCode.data('referredamount');
        let referralNumber = $violationCode.data('referralnumber');

        quarryViolationReferral.editReferralAmountPopup(
            referralId,
            violationId,
            taskId,
            violationCode,
            referralNumber,
            currentReferredAmount
        );

        $(".hiddenListBox").hide(300);
    });

    functions.hideTargetElement(".controls", ".hiddenListBox");
};

quarryViolationReferral.addReferralNumberPopup = (ReferralID, ViolationID, ViolationCode, TaskID) => {
    $(".overlay").removeClass("active");
    let popupHtml = `
        <div class="popupHeader" style="display: flex; justify-content: space-between;">
            <div class="violationsCode">
                <p>إضافة رقم الإحالة للمخالفة رقم (${ViolationCode})</p>
            </div>
            <div class="btnStyle cancelBtn popupBtn closeReferralNumberPopup" id="closeReferralNumberPopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
                <i class="fa-solid fa-x"></i>
            </div>
        </div>
        <div class="popupBody">
            <div class="popupForm detailsPopupForm" id="detailsPopupForm">

                <div class="formContent">
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="referralNumber" class="customLabel">رقم الإحالة</label>
                                        <input class="form-control customInput referralNumber" id="referralNumber" type="text" placeholder="أدخل رقم الإحالة">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="referredAmount" class="customLabel">مبلغ الإحالة</label>
                                        <input class="form-control customInput referredAmount" id="referredAmount" type="text" placeholder="أدخل مبلغ الإحالة">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="referralComments" class="customLabel">ملاحظات</label>
                                        <textarea class="form-control customTextArea referralComments" id="referralComments" rows="3" placeholder="أدخل الملاحظات"></textarea>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="referralNumberAttach" class="customLabel">إرفاق مستند رقم الإحالة</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput referralNumberAttach form-control" id="referralNumberAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
                                            </div>
                                        </div>
                                        <div class="dropFilesArea" id="dropFilesArea"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="formButtonsBox">
                    <div class="row">
                        <div class="col-12">
                            <div class="buttonsBox centerButtonsBox">
                                <div class="btnStyle confirmBtnGreen popupBtn AddReferralNumberBtn" id="AddReferralNumberBtn">تأكيد</div>
                                <div class="btnStyle cancelBtn popupBtn" id="closeReferralNumberPopupFooter" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>`;

    functions.declarePopup(
        ["generalPopupStyle", "greenPopup", "editPopup"],
        popupHtml
    );

    // Add close button handlers
    $("#closeReferralNumberPopup, #closeReferralNumberPopupFooter").on("click", function () {
        functions.closePopup();
    });

    let ReferralNumberInput = "";
    let ReferralAmountInput = "";
    let ReferralCommentsInput = "";
    let filesExtension = [
        "gif", "svg", "jpg", "jpeg", "png",
        "doc", "docx", "pdf", "xls", "xlsx", "pptx"
    ];
    let allAttachments;
    let countOfFiles;
    let request = {};

    // Allow only numbers in referralNumber
    $("#referralNumber").on("keypress", (e) => {
        return functions.isNumberKey(e);
    });

    // Handle referralNumber input - clean non-numeric characters and update variable
    // $("#referralNumber").on("input", (e) => {
    //     let value = $(e.currentTarget).val();
    //     // Remove any non-numeric characters
    //     value = value.replace(/[^0-9]/g, '');
    //     $(e.currentTarget).val(value);
    //     ReferralNumberInput = value;
    // });

    // Remove English & Arabic letters only
    $("#referralNumber").on("input", (e) => {
        let value = $(e.currentTarget).val();

        value = value.replace(/[a-zA-Z\u0600-\u06FF]/g, "");

        $(e.currentTarget).val(value);

        ReferralNumberInput = value.trim();
    });

    // Allow only numbers and decimal point in referredAmount
    $("#referredAmount").on("keypress", (e) => {
        return functions.isDecimalNumberKey(e);
    });

    // Format the referred amount with commas as the user types
    $("#referredAmount").on("input", (e) => {
        let rawValue = $(e.currentTarget).val().replace(/\,/g, "");

        // Remove any non-numeric characters except decimal point
        rawValue = rawValue.replace(/[^0-9.]/g, '');

        // Store the raw value for later use
        ReferralAmountInput = rawValue;

        // Format with commas for display
        if (rawValue) {
            let formatted = rawValue.replace(/\B(?=(?:\d{3})+(?!\d))/g, ",");
            $(e.currentTarget).val(formatted);
        }
    });

    // Handle referralComments input
    $("#referralComments").on("input", (e) => {
        ReferralCommentsInput = $(e.currentTarget).val().trim();
    });

    // File attachment handling
    $("#referralNumberAttach").on("change", (e) => {
        allAttachments = $(e.currentTarget)[0].files;
        if (allAttachments.length > 0) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
        }
        for (let i = 0; i < allAttachments.length; i++) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${allAttachments[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
        }

        $(".deleteFile").on("click", (event) => {
            let index = $(event.currentTarget).closest(".file").index();
            $(event.currentTarget).closest(".file").remove();
            let fileBuffer = new DataTransfer();
            for (let i = 0; i < allAttachments.length; i++) {
                if (index !== i) {
                    fileBuffer.items.add(allAttachments[i]);
                }
            }
            allAttachments = fileBuffer.files;
            countOfFiles = allAttachments.length;
            if (countOfFiles == 0) {
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
            }
        });

        for (let i = 0; i < allAttachments.length; i++) {
            let fileSplited = allAttachments[i].name.split(".");
            let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
            if ($.inArray(fileExt, filesExtension) == -1) {
                functions.warningAlert("من فضلك أدخل الملفات بالمرفقات المسموح بها فقط");
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
                $(e.currentTarget).val("");
            }
        }
    });

    $(".AddReferralNumberBtn").on("click", (e) => {
        if (ReferralNumberInput != "" && ReferralNumberInput != null) {
            if (allAttachments != null && allAttachments.length > 0) {
                request = {
                    Request: {
                        Title: "تم إضافة رقم الإحالة",
                        Comments: ReferralCommentsInput,
                        Status: "قيد الانتظار القطاع",
                        ViolationId: ViolationID,
                        ReferralNumber: ReferralNumberInput,
                        ReferredAmount: ReferralAmountInput,
                        TaskId: TaskID,
                        ID: ReferralID
                    },
                };
                $(".overlay").addClass("active");
                quarryViolationReferral.editReferralAPIResponse(
                    request,
                    ReferralID,
                    "إضافة رقم الإحالة",
                    "#referralNumberAttach",
                    "تم إضافة رقم الإحالة",
                    TaskID,
                    ViolationID,
                    false,
                );
            } else {
                functions.warningAlert("من فضلك قم بإرفاق المستند المرفق به رقم الإحالة");
            }
        } else {
            functions.warningAlert("من فضلك قم بإضافة رقم الإحالة بشكل صحيح");
        }
    });
};

// quarryViolationReferral.editReferralAmountPopup = (
//     ReferralID,
//     ViolationID,
//     TaskID,
//     referralNumber,
//     oldPrice,
// ) => {
//     $(".overlay").removeClass("active");
//     let popupHtml = `
//         <div class="popupHeader">
//             <div class="violationsCode">
//                 <p>تعديل مبلغ الإحالة رقم (${referralNumber})</p>
//             </div>
//         </div>
//         <div class="popupBody">
//             <div class="popupForm detailsPopupForm" id="detailsPopupForm">

//                 <div class="formContent">
//                     <div class="formBox">
//                         <div class="formElements">
//                             <div class="row">
//                                 <div class="col-md-4">
//                                     <div class="form-group customFormGroup">
//                                         <label for="oldViolationPrice" class="customLabel">المبلغ القديم</label>
//                                         <input class="form-control disabled customInput oldViolationPrice" id="oldViolationPrice" type="text" value="${functions.splitBigNumbersByComma(oldPrice)}" disabled>
//                                     </div>
//                                 </div>
//                                 <div class="col-md-4">
//                                     <div class="form-group customFormGroup">
//                                         <label for="referredAmount" class="customLabel">غرامة التسليم للتحريات</label>
//                                         <input class="form-control customInput referredAmount" id="referredAmount" type="text" placeholder="أدخل قيمة الغرامة">
//                                     </div>
//                                 </div>
//                                 <div class="col-md-4">
//                                     <div class="form-group customFormGroup">
//                                         <label for="newTotalAmount" class="customLabel">المبلغ الكلي (الإحالة)</label>
//                                         <input class="form-control customInput newTotalAmount" id="newTotalAmount" type="text" placeholder="سيتم حسابه تلقائياً" disabled>
//                                     </div>
//                                 </div>
//                                 <div class="col-md-12">
//                                     <div class="form-group customFormGroup">
//                                         <label for="amountComments" class="customLabel">ملاحظات</label>
//                                         <textarea class="form-control customTextArea amountComments" id="amountComments" placeholder="أدخل الملاحظات"></textarea>
//                                     </div>
//                                 </div>
//                                 <div class="col-12">
//                                     <div class="form-group customFormGroup">
//                                         <label for="editReferralAmountAttach" class="customLabel">إرفاق مستند إعادة التقييم</label>
//                                         <div class="fileBox" id="dropContainer">
//                                             <div class="inputFileBox">
//                                                 <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
//                                                 <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
//                                                 <input type="file" class="customInput attachFilesInput editReferralAmountAttach form-control" id="editReferralAmountAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
//                                             </div>
//                                         </div>
//                                         <div class="dropFilesArea" id="dropFilesArea"></div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 <div class="formButtonsBox">
//                     <div class="row">
//                         <div class="col-12">
//                             <div class="buttonsBox centerButtonsBox">
//                                 <div class="btnStyle confirmBtnGreen popupBtn editReferralAmountBtn" id="editReferralAmountBtn">تعديل</div>
//                                 <div class="btnStyle cancelBtn popupBtn closeReferralAmountPopup" id="closeReferralAmountPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//             </div>
//         </div>`;

//     functions.declarePopup(
//         ["generalPopupStyle", "greenPopup", "editPopup"],
//         popupHtml
//     );

//     // Remove commas from oldPrice to get the actual numeric value
//     let OldViolationPrice = oldPrice.toString().replace(/\,/g, "");
//     let ReferredAmountInput = "";
//     let NewTotalAmountInput = "";
//     let AmountCommentsInput = "";
//     let filesExtension = [
//         "gif", "svg", "jpg", "jpeg", "png",
//         "doc", "docx", "pdf", "xls", "xlsx", "pptx"
//     ];
//     let allAttachments;
//     let countOfFiles;
//     let PositiveDecimalNumbers = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;
//     let request = {};

//     // File attachment handling
//     $("#editReferralAmountAttach").on("change", (e) => {
//         allAttachments = $(e.currentTarget)[0].files;
//         if (allAttachments.length > 0) {
//             $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
//         }
//         for (let i = 0; i < allAttachments.length; i++) {
//             $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
//                 <div class="file">
//                     <p class="fileName">${allAttachments[i].name}</p>
//                     <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
//                 </div>
//             `);
//         }

//         $(".deleteFile").on("click", (event) => {
//             let index = $(event.currentTarget).closest(".file").index();
//             $(event.currentTarget).closest(".file").remove();
//             let fileBuffer = new DataTransfer();
//             for (let i = 0; i < allAttachments.length; i++) {
//                 if (index !== i) {
//                     fileBuffer.items.add(allAttachments[i]);
//                 }
//             }
//             allAttachments = fileBuffer.files;
//             countOfFiles = allAttachments.length;
//             if (countOfFiles == 0) {
//                 $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
//             }
//         });

//         for (let i = 0; i < allAttachments.length; i++) {
//             let fileSplited = allAttachments[i].name.split(".");
//             let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
//             if ($.inArray(fileExt, filesExtension) == -1) {
//                 functions.warningAlert("من فضلك أدخل الملفات بالمرفقات المسموح بها فقط");
//                 $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
//                 $(e.currentTarget).val("");
//             }
//         }
//     });

//     // Calculate total when referred amount changes
//     $("#referredAmount").on("keypress", (e) => {
//         return functions.isDecimalNumberKey(e);
//     });

//     $("#referredAmount").on("keyup", (e) => {
//         // Remove commas for calculation, then add them back for display
//         let rawValue = $(e.currentTarget).val().replace(/\,/g, "");
//         ReferredAmountInput = rawValue;

//         // Format for display
//         $(e.currentTarget).val(
//             rawValue.replace(/\B(?=(?:\d{3})+(?!\d))/g, ",")
//         );

//         // Calculate new total
//         let oldAmount = parseFloat(OldViolationPrice) || 0;
//         let referredAmount = parseFloat(ReferredAmountInput) || 0;
//         let newTotal = oldAmount + referredAmount;

//         // Update total field
//         let formattedTotal = functions.splitBigNumbersByComma(newTotal.toString());
//         $("#newTotalAmount").val(formattedTotal);
//         NewTotalAmountInput = newTotal.toString();
//     });

//     $("#amountComments").on("keyup", (e) => {
//         AmountCommentsInput = $(e.currentTarget).val().trim();
//     });

//     $("#editReferralAmountBtn").on("click", (e) => {
//         // Remove any commas from input before validation
//         let cleanReferredAmount = ReferredAmountInput.replace(/\,/g, "");

//         if (cleanReferredAmount != "" && PositiveDecimalNumbers.test(cleanReferredAmount)) {
//             if (allAttachments != null && allAttachments.length > 0) {
//                 request = {
//                     Request: {
//                         Title: "تم تعديل مبلغ الإحالة",
//                         Comments: AmountCommentsInput,
//                         ViolationId: ViolationID,
//                         ID: ReferralID,
//                         TaskId: TaskID,
//                         ReferredAmount: parseFloat(cleanReferredAmount),
//                         TotalPriceDue: parseFloat(NewTotalAmountInput),
//                         TotalOldPrice: parseFloat(OldViolationPrice)
//                     },
//                 };
//                 $(".overlay").addClass("active");
//                 quarryViolationReferral.editReferralAPIResponse(
//                     request,
//                     ReferralID,
//                     "تعديل المبلغ",
//                     "#editReferralAmountAttach",
//                     "تم تعديل مبلغ الإحالة بناء على إعادة التقييم"
//                 );
//             } else {
//                 functions.warningAlert("من فضلك قم بإرفاق المستند الخاص بإعادة التقييم");
//             }
//         } else {
//             functions.warningAlert("من فضلك قم بإدخال قيمة غرامة التسليم للتحريات بشكل صحيح");
//         }
//     });
// };

quarryViolationReferral.editReferralAPIResponse = (
    request,
    ReferralId,
    uploadPhase,
    attachInput,
    Message = "",
    TaskID = null,
    ViolationID = null,
    caseStatus = null,
    isEditViolationAmount = false  // Default parameter
) => {
    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/Save",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            if (data.d.Status) {
                // Use the passed caseStatus if available, otherwise check request
                let currentCaseStatus = isEditViolationAmount ? caseStatus : request.Request.Status;

                if (TaskID && ViolationID && currentCaseStatus) {
                    quarryViolationReferral.updateViolationTaskStatus(TaskID, ViolationID, currentCaseStatus)
                        .then(() => {
                            quarryViolationReferral.addNewReferralAttachmentRecord(
                                ReferralId,
                                uploadPhase,
                                attachInput,
                                Message
                            );
                        });
                } else {
                    quarryViolationReferral.addNewReferralAttachmentRecord(
                        ReferralId,
                        uploadPhase,
                        attachInput,
                        Message
                    );
                }
            } else {
                functions.warningAlert("هناك خطأ في إرسال بيانات الطلب");
            }
        })
        .catch((err) => {
            console.error(err);
            functions.warningAlert("حدث خطأ في الاتصال بالخادم");
        });
};

quarryViolationReferral.addNewReferralAttachmentRecord = (
    ReferralId,
    uploadPhase,
    attachInput,
    Message = "",
    Comments = ""
) => {
    let request = {
        Request: {
            Title: "New Attachment Record",
            CaseId: ReferralId,
            UploadPhase: uploadPhase,
            Comments: Comments,
        },
    };

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/CaseAttachments.aspx/Save",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            if (data.d.Status) {
                let RecordId = data.d.Result.Id;
                quarryViolationReferral.uploadReferralAttachments(
                    RecordId,
                    attachInput,
                    "CasesAttachments",
                    Message
                );
            } else {
                functions.warningAlert("هناك خطأ في إرسال بيانات الطلب");
            }
        })
        .catch((err) => {
            console.error(err);
            functions.warningAlert("حدث خطأ في الاتصال بالخادم");
        });
};

quarryViolationReferral.uploadReferralAttachments = (
    RecordId,
    attachInput,
    ListName,
    Message
) => {
    let Data = new FormData();
    Data.append("itemId", RecordId);
    Data.append("listName", ListName);
    for (let i = 0; i <= $(attachInput)[0].files.length; i++) {
        Data.append("file" + i, $(attachInput)[0].files[i]);
    }

    $.ajax({
        type: "POST",
        url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
        processData: false,
        contentType: false,
        data: Data,
        success: (data) => {
            $(".overlay").removeClass("active");
            functions.sucessAlert(Message);
            functions.closePopup();
        },
        error: (err) => {
            functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
            $(".overlay").removeClass("active");
        },
    });
};

quarryViolationReferral.getReferralAttachmentsByReferralId = (ReferralId, referralNumber) => {
    let request = {
        Request: {
            CaseId: ReferralId,
        }
    };

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/CaseAttachments.aspx/Search",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            let ReferralAttachmentsRecords;
            if (data.d.Status) {
                if (data.d.Result.length > 0) {
                    ReferralAttachmentsRecords = data.d.Result;
                } else {
                    ReferralAttachmentsRecords = [];
                }
                quarryViolationReferral.referralAttachmentsDetailsPopup(
                    ReferralId,
                    referralNumber,
                    ReferralAttachmentsRecords
                );
            }
        })
        .catch((err) => {
            console.error(err);
            functions.warningAlert("هناك خطأ في إرسال بيانات الطلب");
        });
};

quarryViolationReferral.referralAttachmentsDetailsPopup = (
    ReferralId,
    referralNumber,
    ReferralAttachmentsRecords
) => {
    let popupHtml = `
        <div class="popupHeader attachPopup" style="display: flex; justify-content: space-between;">
            <div class="violationsCode">
                <p>مرفقات الإحالة رقم (${referralNumber || "-----"})</p>
            </div>
            <div class="btnStyle cancelBtn popupBtn closeReferralAttachPopup" id="closeReferralAttachPopup" style="color: #fff;cursor: pointer;" data-dismiss="modal" aria-label="Close">
                <i class="fa-solid fa-x"></i>
            </div>
        </div>
        <div class="popupBody">
            <div class="popupTableBox">
                <table id="referralAttachmentsTable" class="table tableWithIcons popupTable"></table>
            </div>
            <div class="formButtonsBox">
                <div class="row">
                    <div class="col-12">
                        <div class="buttonsBox centerButtonsBox">
                            <div class="btnStyle cancelBtn popupBtn closeReferralAttachPopupFooter" id="closeReferralAttachPopupFooter" data-dismiss="modal" aria-label="Close">إغلاق</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    functions.declarePopup(
        ["generalPopupStyle", "greenPopup", "editPopup", "attachPopup"],
        popupHtml
    );

    quarryViolationReferral.drawReferralAttachmentsPopupTable(
        "#referralAttachmentsTable",
        ReferralAttachmentsRecords
    );

    // Add close button handlers
    $("#closeReferralAttachPopup, #closeReferralAttachPopupFooter").on("click", function () {
        functions.closePopup();
    });
};

quarryViolationReferral.drawReferralAttachmentsPopupTable = (
    TableId,
    ReferralAttachmentsRecords
) => {
    $(".overlay").removeClass("active");
    let data = [];
    let counter = 1;

    if (ReferralAttachmentsRecords.length > 0) {
        ReferralAttachmentsRecords.forEach((attchRecord) => {
            let attachedFilesData = attchRecord.Attachments;
            data.push([
                `<div class="attachCount">${counter}</div>`,
                `<div class="attachFiles" data-fileslength="${attachedFilesData.length}">
                    ${quarryViolationReferral.drawAttachmentsInTable(attachedFilesData)}
                </div>`,
                `<div class="attachUploadPhase">${attchRecord.UploadPhase}</div>`,
                `<div class="attachUploadDate">${functions.getFormatedDate(
                    attchRecord.Created,
                    "DD-MM-YYYY hh:mm A"
                )}</div>`,
                `<div class="attachComments">${attchRecord.Comments != ""
                    ? attchRecord.Comments
                    : "----"
                }</div>`,
            ]);
            counter++;
        });
    }

    let Table = $(TableId).DataTable({
        destroy: true,
        paging: false,
        searching: false,
        ordering: false,
        info: false,
        responsive: true,
        autoWidth: false,
        scrollX: false,
        data: data,

        columns: [
            { title: "م" },
            { title: "المرفقات" },
            { title: "سبب الإرفاق" },
            { title: "تاريخ الإرفاق" },
            { title: "ملاحظات" }
        ],

        language: {
            emptyTable: "لا توجد بيانات"
        }
    });

    let referralAttachmentsLog = Table.rows().nodes().to$();
    $.each(referralAttachmentsLog, (index, record) => {
        let jQueryRecord = $(record);
        let attachFiles = jQueryRecord.find(".attachFiles");
        let attachFilesLength = jQueryRecord.find(".attachFiles").data("fileslength");

        if (attachFilesLength == 1) {
            attachFiles.find(".attchedFile").addClass("singleFile");
        }
        if (attachFilesLength == 2) {
            attachFiles.find(".attchedFile").addClass("multibleFiles");
        }
        if (attachFilesLength >= 3) {
            attachFiles.find(".attchedFile").addClass("manyFiles");
        }
    });
};

quarryViolationReferral.drawAttachmentsInTable = (Attachments) => {
    let attachmentsBox = ``;

    if (Attachments.length > 0) {
        Attachments.forEach((attachment) => {
            attachmentsBox += `
                <a class="attchedFile" target="_blank" href="${attachment.Url}" download="${attachment.Name}" title="${attachment.Name}">
                    <div class="attachDetailsBox">
                        <p class="attchedFileName">${attachment.Name}</p>
                    </div>
                    <span><i class="fa-solid fa-download"></i></span>
                </a>
            `;
        });
    } else {
        attachmentsBox = `<p class="noAttachedFiles">لا يوجد مرفقات</p>`;
    }
    return attachmentsBox;
};

quarryViolationReferral.FindReferralById = (ReferralID, popupType = "") => {
    let request = {
        Id: ReferralID,
    };

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/FindById",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            let referralData;
            let Content;

            if (data != null) {
                referralData = data.d.Result;
                // // Fix: Ensure Equipments exists
                // if (referralData.Violation && !referralData.Violation.Equipments) {
                //     referralData.Violation.Equipments = [];
                // }

                // Create a popup with both violation details and referral/case details
                $(".overlay").removeClass("active");

                // Build the popup HTML similar to violationsCases.getCaseDetails
                Content = quarryViolationReferral.getReferralDetails(referralData);

                functions.declarePopup(
                    ["generalPopupStyle", "greenPopup", "caseDetailsPopup"],
                    Content
                );

                // Add print functionality
                $(".printBtn").on("click", (e) => {
                    functions.PrintDetails(e);
                });

                // Add close button functionality
                $(".closeReferralDetailsPopup, .closeDetailsPopup").on("click", function () {
                    functions.closePopup();
                });
            } else {
                referralData = null;
                functions.warningAlert("لا توجد بيانات للإحالة المطلوبة");
            }
        })
        .catch((err) => {
            console.error(err);
            $(".overlay").removeClass("active");
            functions.warningAlert("حدث خطأ في جلب تفاصيل الإحالة");
        });
};

///////////////////////////////////////////
quarryViolationReferral.getReferralDetails = (referralData) => {
    let violation = referralData.Violation;
    let violationOffenderType = referralData.OffenderType || "Quarry";
    let popupTitle;

    if (referralData.ReferralNumber) {
        popupTitle = `تفاصيل الإحالة رقم (${referralData.ReferralNumber})`;
    } else {
        popupTitle = `تفاصيل الإحالة عن المخالفة رقم (${referralData.ViolationCode})`;
    }

    let popupHtml = `
<div class="caseDetialsPrintBox" id="printJS-form">
    <div class="popupHeader">
        <div class="popupTitleBox">
            <div class="CaseNumberBox">
                <p class="caseNumber">${popupTitle}</p>
                <div class="printBtn"><img src="/Style Library/MiningViolations/images/WhitePrintBtn.png" alt="Print Button"></div>
            </div>
            <div class="btnStyle cancelBtn popupBtn closeReferralDetailsPopup" id="closeReferralDetailsPopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
                <i class="fa-solid fa-x"></i>
            </div>
        </div>
    </div>
    <div class="popupBody" style="overflow-y: auto; max-height: 80vh;"> <!-- Added inline styles -->
        <div class="popupForm detailsPopupForm" id="detailsPopupForm">
                <div class="formContent">
                    <div class="formBox">
                        <div class="formBoxHeader">
                            <p class="formBoxTitle"><span class="formNumber">1</span> تفاصيل الإحالة</p>
                        </div>
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="referralNumber" class="customLabel">رقم الإحالة</label>
                                        <input class="form-control customInput referralNumber" id="referralNumber" type="text" value="${referralData.ReferralNumber || "----"}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="refferedDate" class="customLabel">تاريخ الإحالة</label>
                                        <input class="form-control customInput refferedDate" id="refferedDate" type="text" value="${functions.getFormatedDate(referralData.RefferedDate)}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="referralStatus" class="customLabel">حالة الإحالة</label>
                                        <input class="form-control customInput referralStatus" id="referralStatus" type="text" value="${referralData.Status || "----"}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="violationStatus" class="customLabel">حالة المخالفة</label>
                                        <input class="form-control customInput violationStatus" id="violationStatus" type="text" value="${functions.getViolationStatusText(referralData.ViolationStatus)}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="caseNumber" class="customLabel">رقم القضية</label>
                                        <input class="form-control customInput caseNumber" id="caseNumber" type="text" value="${referralData.CaseNumber || "----"}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="taskId" class="customLabel">رقم المهمة</label>
                                        <input class="form-control customInput taskId" id="taskId" type="text" value="${referralData.TaskId || "----"}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-12">
                                    <div class="form-group customFormGroup">
                                        <label for="comments" class="customLabel">ملاحظات</label>
                                        <textarea class="form-control customTextArea comments" id="comments" disabled>${referralData.Comments || "----"}</textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="formContent">
                    <div class="formBox">
                        <div class="formBoxHeader">
                            <p class="formBoxTitle"><span class="formNumber">2</span> تفاصيل المخالفة</p>
                        </div>
                        <div class="formElements">
                            <div class="row">
                                ${violationOffenderType == "Quarry"
            ? quarryViolationReferral.referralQuarryDetails(violation)
            : violationOffenderType == "Vehicle"
                ? quarryViolationReferral.referralVehicleDetails(violation)
                : quarryViolationReferral.referralEquipmentDetails(violation)
        }
                            </div>
                        </div>
                    </div>
                </div>

                <div class="formButtonsBox">
                    <div class="row">
                        <div class="col-12">
                            <div class="buttonsBox centerButtonsBox ">
                                <div class="btnStyle cancelBtn popupBtn closeDetailsPopup" id="closeDetailsPopup" data-dismiss="modal" aria-label="Close">إغلاق</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>`;

    return popupHtml;
};
quarryViolationReferral.referralQuarryDetails = (violationData) => {
    let detailsHtml = `
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationCode" class="customLabel">رقم المخالفة</label>
                <input class="form-control customInput violationCode" id="violationCode" type="text" value="${violationData.ViolationCode || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violatorName" class="customLabel">اسم المخالف</label>
                <input class="form-control customInput violatorName" id="violatorName" type="text" value="${violationData.ViolatorName || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violatorCompany" class="customLabel">الشركة المخالفة التابع لها</label>
                <input class="form-control customInput violatorCompany" id="violatorCompany" type="text" value="${violationData.ViolatorCompany || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationType" class="customLabel">نوع المخالفة</label>
                <input class="form-control customInput violationType" id="violationType" type="text" value="${violationData.ViolationTypes?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="materialType" class="customLabel">نوع الخام</label>
                <input class="form-control customInput materialType" id="materialType" type="text" value="${violationData.Material?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationGov" class="customLabel">المحافظة</label>
                <input class="form-control customInput violationGov" id="violationGov" type="text" value="${violationData.Governrates?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationZone" class="customLabel">منطقة الضبط</label>
                <input class="form-control customInput violationZone" id="violationZone" type="text" value="${violationData.ViolationsZone || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationDate" class="customLabel">تاريخ الضبط</label>
                <input class="form-control customInput violationDate" id="violationDate" type="text" value="${functions.getFormatedDate(violationData.ViolationDate)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationTime" class="customLabel">وقت الضبط</label>
                <input class="form-control customInput violationTime" id="violationTime" type="text" value="${functions.getFormatedDate(violationData.ViolationTime, "hh:mm A")}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="totalOldPrice" class="customLabel">المبلغ القديم</label>
                <input class="form-control customInput totalOldPrice" id="totalOldPrice" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalOldPrice || 0)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="totalPriceDue" class="customLabel">المبلغ المستحق</label>
                <input class="form-control customInput totalPriceDue" id="totalPriceDue" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalPriceDue || 0)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="quarryCode" class="customLabel">رقم المحجر</label>
                <input class="form-control customInput quarryCode" id="quarryCode" type="text" value="${violationData.QuarryCode || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="quarryType" class="customLabel">نوع المحجر</label>
                <input class="form-control customInput quarryType" id="quarryType" type="text" value="${violationData.QuarryType || "----"}" disabled>
            </div>
        </div>
    `;
    return detailsHtml;
};
quarryViolationReferral.referralVehicleDetails = (violationData) => {
    let detailsHtml = `
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationCode" class="customLabel">رقم المخالفة</label>
                <input class="form-control customInput violationCode" id="violationCode" type="text" value="${violationData.ViolationCode || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violatorName" class="customLabel">اسم المخالف</label>
                <input class="form-control customInput violatorName" id="violatorName" type="text" value="${violationData.ViolatorName || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violatorCompany" class="customLabel">الشركة المخالفة التابع لها</label>
                <input class="form-control customInput violatorCompany" id="violatorCompany" type="text" value="${violationData.ViolatorCompany || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationType" class="customLabel">نوع المخالفة</label>
                <input class="form-control customInput violationType" id="violationType" type="text" value="${violationData.ViolationTypes?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="materialType" class="customLabel">نوع الخام</label>
                <input class="form-control customInput materialType" id="materialType" type="text" value="${violationData.Material?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationGov" class="customLabel">المحافظة</label>
                <input class="form-control customInput violationGov" id="violationGov" type="text" value="${violationData.Governrates?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationZone" class="customLabel">منطقة الضبط</label>
                <input class="form-control customInput violationZone" id="violationZone" type="text" value="${violationData.ViolationsZone || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationDate" class="customLabel">تاريخ الضبط</label>
                <input class="form-control customInput violationDate" id="violationDate" type="text" value="${functions.getFormatedDate(violationData.ViolationDate)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationTime" class="customLabel">وقت الضبط</label>
                <input class="form-control customInput violationTime" id="violationTime" type="text" value="${functions.getFormatedDate(violationData.ViolationTime, "hh:mm A")}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="totalOldPrice" class="customLabel">المبلغ القديم</label>
                <input class="form-control customInput totalOldPrice" id="totalOldPrice" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalOldPrice || 0)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="totalPriceDue" class="customLabel">المبلغ المستحق</label>
                <input class="form-control customInput totalPriceDue" id="totalPriceDue" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalPriceDue || 0)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="carNumber" class="customLabel">رقم العربة</label>
                <input class="form-control customInput carNumber" id="carNumber" type="text" value="${violationData.CarNumber || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="vehicleType" class="customLabel">نوع العربة</label>
                                <input class="form-control customInput vehicleType" id="vehicleType" type="text" value="${violationData.VehicleType || "----"}" disabled>
            </div>
        </div>
    `;
    return detailsHtml;
};
quarryViolationReferral.referralEquipmentDetails = (violationData) => {
    let detailsHtml = `
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationCode" class="customLabel">رقم المخالفة</label>
                <input class="form-control customInput violationCode" id="violationCode" type="text" value="${violationData.ViolationCode || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violatorName" class="customLabel">اسم المخالف</label>
                <input class="form-control customInput violatorName" id="violatorName" type="text" value="${violationData.ViolatorName || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violatorCompany" class="customLabel">الشركة المخالفة التابع لها</label>
                <input class="form-control customInput violatorCompany" id="violatorCompany" type="text" value="${violationData.ViolatorCompany || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationType" class="customLabel">نوع المخالفة</label>
                <input class="form-control customInput violationType" id="violationType" type="text" value="${violationData.ViolationTypes?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="materialType" class="customLabel">نوع الخام</label>
                <input class="form-control customInput materialType" id="materialType" type="text" value="${violationData.Material?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationGov" class="customLabel">المحافظة</label>
                <input class="form-control customInput violationGov" id="violationGov" type="text" value="${violationData.Governrates?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationZone" class="customLabel">منطقة الضبط</label>
                <input class="form-control customInput violationZone" id="violationZone" type="text" value="${violationData.ViolationsZone || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationDate" class="customLabel">تاريخ الضبط</label>
                <input class="form-control customInput violationDate" id="violationDate" type="text" value="${functions.getFormatedDate(violationData.ViolationDate)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationTime" class="customLabel">وقت الضبط</label>
                <input class="form-control customInput violationTime" id="violationTime" type="text" value="${functions.getFormatedDate(violationData.ViolationTime, "hh:mm A")}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="totalOldPrice" class="customLabel">المبلغ القديم</label>
                <input class="form-control customInput totalOldPrice" id="totalOldPrice" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalOldPrice || 0)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="totalPriceDue" class="customLabel">المبلغ المستحق</label>
                <input class="form-control customInput totalPriceDue" id="totalPriceDue" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalPriceDue || 0)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="equipmentType" class="customLabel">نوع المعدة</label>
                <input class="form-control customInput equipmentType" id="equipmentType" type="text" value="${violationData.EquipmentType || "----"}" disabled>
            </div>
        </div>
    `;
    return detailsHtml;
};
////////////////////////////////////////////////
quarryViolationReferral.editViolationAmountPopup = (
    ReferralID,
    ViolationID,
    TaskID,
    violationCode,
    referralNumber,
    currentAmount
) => {
    $(".overlay").removeClass("active");

    let popupTitle = referralNumber
        ? `تعديل مبلغ المخالفة - الإحالة رقم (${referralNumber})`
        : `تعديل مبلغ المخالفة رقم (${violationCode})`;

    let popupHtml = `
        <div class="popupHeader" style="display: flex; justify-content: space-between;">
            <div class="violationsCode">
                <p>${popupTitle}</p>
            </div>
            <div class="btnStyle cancelBtn popupBtn closeEditViolationAmountPopup" id="closeEditViolationAmountPopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
                <i class="fa-solid fa-x"></i>
            </div>
        </div>
        <div class="popupBody">
            <div class="popupForm detailsPopupForm" id="detailsPopupForm">

                <div class="formContent">
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="currentViolationAmount" class="customLabel">المبلغ الحالي</label>
                                        <input class="form-control disabled customInput currentViolationAmount" id="currentViolationAmount" type="text" value="${functions.splitBigNumbersByComma(currentAmount)}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="newViolationAmount" class="customLabel">المبلغ الجديد</label>
                                        <input class="form-control customInput newViolationAmount" id="newViolationAmount" type="text" placeholder="أدخل المبلغ الجديد">
                                    </div>
                                </div>
                                <div class="col-md-12">
                                    <div class="form-group customFormGroup">
                                        <label for="violationAmountComments" class="customLabel">ملاحظات</label>
                                        <textarea class="form-control customTextArea violationAmountComments" id="violationAmountComments" rows="3" placeholder="أدخل الملاحظات"></textarea>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="editViolationAmountAttach" class="customLabel">إرفاق مستند تعديل المبلغ * </label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput editViolationAmountAttach form-control" id="editViolationAmountAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
                                            </div>
                                        </div>
                                        <div class="dropFilesArea" id="dropFilesArea"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="formButtonsBox">
                    <div class="row">
                        <div class="col-12">
                            <div class="buttonsBox centerButtonsBox">
                                <div class="btnStyle confirmBtnGreen popupBtn confirmEditViolationAmountBtn" id="confirmEditViolationAmountBtn">تأكيد</div>
                                <div class="btnStyle cancelBtn popupBtn" id="closeEditViolationAmountPopupFooter" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>`;

    functions.declarePopup(
        ["generalPopupStyle", "greenPopup", "editPopup"],
        popupHtml
    );

    // Add close button handlers
    $("#closeEditViolationAmountPopup, #closeEditViolationAmountPopupFooter").on("click", function () {
        functions.closePopup();
    });

    let filesExtension = [
        "gif", "svg", "jpg", "jpeg", "png",
        "doc", "docx", "pdf", "xls", "xlsx", "pptx"
    ];
    let allAttachments;
    let countOfFiles;
    let NewViolationAmountInput = "";

    // Store the current amount as old price
    let OldViolationAmount = currentAmount;

    // File attachment handling
    $("#editViolationAmountAttach").on("change", (e) => {
        allAttachments = $(e.currentTarget)[0].files;
        if (allAttachments.length > 0) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
        }
        for (let i = 0; i < allAttachments.length; i++) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${allAttachments[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
        }

        $(".deleteFile").on("click", (event) => {
            let index = $(event.currentTarget).closest(".file").index();
            $(event.currentTarget).closest(".file").remove();
            let fileBuffer = new DataTransfer();
            for (let i = 0; i < allAttachments.length; i++) {
                if (index !== i) {
                    fileBuffer.items.add(allAttachments[i]);
                }
            }
            allAttachments = fileBuffer.files;
            countOfFiles = allAttachments.length;
            if (countOfFiles == 0) {
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
            }
        });

        for (let i = 0; i < allAttachments.length; i++) {
            let fileSplited = allAttachments[i].name.split(".");
            let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
            if ($.inArray(fileExt, filesExtension) == -1) {
                functions.warningAlert("من فضلك أدخل الملفات بالمرفقات المسموح بها فقط");
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
                $(e.currentTarget).val("");
            }
        }
    });

    // Format amount input
    $("#newViolationAmount").on("keypress", (e) => {
        return functions.isDecimalNumberKey(e);
    });

    $("#newViolationAmount").on("input", (e) => {
        let rawValue = $(e.currentTarget).val().replace(/\,/g, "");
        rawValue = rawValue.replace(/[^0-9.]/g, '');
        NewViolationAmountInput = rawValue;

        if (rawValue) {
            let formatted = rawValue.replace(/\B(?=(?:\d{3})+(?!\d))/g, ",");
            $(e.currentTarget).val(formatted);
        }
    });

    $(".confirmEditViolationAmountBtn").on("click", (e) => {
        let cleanAmount = NewViolationAmountInput.replace(/\,/g, "");

        if (cleanAmount != "" && !isNaN(parseFloat(cleanAmount)) && parseFloat(cleanAmount) > 0) {
            if (allAttachments != null && allAttachments.length > 0) {
                let comments = $("#violationAmountComments").val().trim();

                let request = {
                    Request: {
                        Title: "تم تعديل مبلغ المخالفة",
                        Comments: comments,
                        ViolationId: ViolationID,
                        ID: ReferralID,
                        TaskId: TaskID,
                        TotalPriceDue: parseFloat(cleanAmount),
                        TotalOldPrice: parseFloat(OldViolationAmount)
                    },
                };

                // Fix: Get the case status from the data attribute
                let caseStatus = $(`[data-referralid="${ReferralID}"]`).data('referralstatus');

                $(".overlay").addClass("active");
                quarryViolationReferral.editReferralAPIResponse(
                    request,
                    ReferralID,
                    "تعديل مبلغ المخالفة",
                    "#editViolationAmountAttach",
                    "تم تعديل مبلغ المخالفة بنجاح",
                    TaskID,
                    ViolationID,
                    caseStatus,  // Now this variable is properly defined
                    true  // isEditViolationAmount
                );
            } else {
                functions.warningAlert("من فضلك قم بإرفاق مستند تعديل المبلغ");
            }
        } else {
            functions.warningAlert("من فضلك قم بإدخال المبلغ الجديد بشكل صحيح");
        }
    });
};
quarryViolationReferral.editReferralAmountPopup = (
    ReferralID,
    ViolationID,
    TaskID,
    violationCode,
    referralNumber,
    currentReferredAmount
) => {
    $(".overlay").removeClass("active");

    let popupHtml = `
        <div class="popupHeader" style="display: flex; justify-content: space-between;">
            <div class="violationsCode">
                <p>تعديل مبلغ الإحالة - الإحالة رقم (${referralNumber})</p>
            </div>
            <div class="btnStyle cancelBtn popupBtn closeEditReferralAmountPopup" id="closeEditReferralAmountPopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
                <i class="fa-solid fa-x"></i>
            </div>
        </div>
        <div class="popupBody">
            <div class="popupForm detailsPopupForm" id="detailsPopupForm">

                <div class="formContent">
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="currentReferralAmount" class="customLabel">مبلغ الإحالة الحالي</label>
                                        <input class="form-control disabled customInput currentReferralAmount" id="currentReferralAmount" type="text" value="${functions.splitBigNumbersByComma(currentReferredAmount)}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="newReferralAmount" class="customLabel">مبلغ الإحالة الجديد</label>
                                        <input class="form-control customInput newReferralAmount" id="newReferralAmount" type="text" placeholder="أدخل مبلغ الإحالة الجديد">
                                    </div>
                                </div>
                                <div class="col-md-12">
                                    <div class="form-group customFormGroup">
                                        <label for="referralAmountComments" class="customLabel">ملاحظات</label>
                                        <textarea class="form-control customTextArea referralAmountComments" id="referralAmountComments" rows="3" placeholder="أدخل الملاحظات"></textarea>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="editReferralAmountAttach" class="customLabel">إرفاق مستند تعديل مبلغ الإحالة * </label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput editReferralAmountAttachNew form-control" id="editReferralAmountAttachNew" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
                                            </div>
                                        </div>
                                        <div class="dropFilesArea" id="dropFilesArea"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="formButtonsBox">
                    <div class="row">
                        <div class="col-12">
                            <div class="buttonsBox centerButtonsBox">
                                <div class="btnStyle confirmBtnGreen popupBtn confirmEditReferralAmountBtn" id="confirmEditReferralAmountBtn">تأكيد</div>
                                <div class="btnStyle cancelBtn popupBtn" id="closeEditReferralAmountPopupFooter" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>`;

    functions.declarePopup(
        ["generalPopupStyle", "greenPopup", "editPopup"],
        popupHtml
    );

    // Add close button handlers
    $("#closeEditReferralAmountPopup, #closeEditReferralAmountPopupFooter").on("click", function () {
        functions.closePopup();
    });

    let filesExtension = [
        "gif", "svg", "jpg", "jpeg", "png",
        "doc", "docx", "pdf", "xls", "xlsx", "pptx"
    ];
    let allAttachments;
    let countOfFiles;
    let NewReferralAmountInput = "";

    // File attachment handling
    $("#editReferralAmountAttachNew").on("change", (e) => {
        allAttachments = $(e.currentTarget)[0].files;
        if (allAttachments.length > 0) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
        }
        for (let i = 0; i < allAttachments.length; i++) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${allAttachments[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
        }

        $(".deleteFile").on("click", (event) => {
            let index = $(event.currentTarget).closest(".file").index();
            $(event.currentTarget).closest(".file").remove();
            let fileBuffer = new DataTransfer();
            for (let i = 0; i < allAttachments.length; i++) {
                if (index !== i) {
                    fileBuffer.items.add(allAttachments[i]);
                }
            }
            allAttachments = fileBuffer.files;
            countOfFiles = allAttachments.length;
            if (countOfFiles == 0) {
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
            }
        });

        for (let i = 0; i < allAttachments.length; i++) {
            let fileSplited = allAttachments[i].name.split(".");
            let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
            if ($.inArray(fileExt, filesExtension) == -1) {
                functions.warningAlert("من فضلك أدخل الملفات بالمرفقات المسموح بها فقط");
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
                $(e.currentTarget).val("");
            }
        }
    });

    // Format amount input
    $("#newReferralAmount").on("keypress", (e) => {
        return functions.isDecimalNumberKey(e);
    });

    $("#newReferralAmount").on("input", (e) => {
        let rawValue = $(e.currentTarget).val().replace(/\,/g, "");
        rawValue = rawValue.replace(/[^0-9.]/g, '');
        NewReferralAmountInput = rawValue;

        if (rawValue) {
            let formatted = rawValue.replace(/\B(?=(?:\d{3})+(?!\d))/g, ",");
            $(e.currentTarget).val(formatted);
        }
    });

    $(".confirmEditReferralAmountBtn").on("click", (e) => {
        let cleanAmount = NewReferralAmountInput.replace(/\,/g, "");

        if (cleanAmount != "" && !isNaN(parseFloat(cleanAmount)) && parseFloat(cleanAmount) > 0) {
            if (allAttachments != null && allAttachments.length > 0) {
                let comments = $("#referralAmountComments").val().trim();

                let request = {
                    Request: {
                        Title: "تم تعديل مبلغ الإحالة",
                        Comments: comments,
                        ViolationId: ViolationID,
                        ID: ReferralID,
                        TaskId: TaskID,
                        ReferredAmount: parseFloat(cleanAmount)
                    },
                };

                let isEditViolationAmount = true;

                let caseStatus = $(`[data-referralid="${ReferralID}"]`).data('referralstatus');

                $(".overlay").addClass("active");
                quarryViolationReferral.editReferralAPIResponse(
                    request,
                    ReferralID,
                    "تعديل مبلغ الإحالة",
                    "#editReferralAmountAttachNew",
                    "تم تعديل مبلغ الإحالة بنجاح",
                    TaskID,
                    ViolationID,
                    caseStatus,
                    isEditViolationAmount  // Pass the variable
                );
            } else {
                functions.warningAlert("من فضلك قم بإرفاق مستند تعديل مبلغ الإحالة");
            }
        } else {
            functions.warningAlert("من فضلك قم بإدخال مبلغ الإحالة الجديد بشكل صحيح");
        }
    });
};
quarryViolationReferral.editViolationAmountAPIResponse = (
    request,
    ReferralId,
    uploadPhase,
    attachInput,
    Message = ""
) => {
    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/Save",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            if (data.d.Status) {
                quarryViolationReferral.addNewReferralAttachmentRecord(
                    ReferralId,
                    uploadPhase,
                    attachInput,
                    Message
                );
            } else {
                functions.warningAlert("هناك خطأ في إرسال بيانات الطلب");
            }
        })
        .catch((err) => {
            console.error(err);
            functions.warningAlert("حدث خطأ في الاتصال بالخادم");
        });
};

quarryViolationReferral.editReferralAmountAPIResponse = (
    request,
    ReferralId,
    uploadPhase,
    attachInput,
    Message = ""
) => {
    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/Save",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            if (data.d.Status) {
                quarryViolationReferral.addNewReferralAttachmentRecord(
                    ReferralId,
                    uploadPhase,
                    attachInput,
                    Message
                );
            } else {
                functions.warningAlert("هناك خطأ في إرسال بيانات الطلب");
            }
        })
        .catch((err) => {
            console.error(err);
            functions.warningAlert("حدث خطأ في الاتصال بالخادم");
        });
};
////////////////////////////////////////////////////
quarryViolationReferral.payCaseBeforeEditPopup = (
    ReferralID,
    ViolationID,
    TaskID,
    referralNumber,
    violationCode,
    totalPrice
) => {
    $(".overlay").removeClass("active");
    let popupHtml = `
        <div class="popupHeader" style="display: flex; justify-content: space-between;">
            <div class="violationsCode">
                <p>سداد على نموذج التقييم - الإحالة رقم (${referralNumber})</p>
            </div>
            <div class="btnStyle cancelBtn popupBtn closePayCaseBeforeEditPopup" id="closePayCaseBeforeEditPopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
                <i class="fa-solid fa-x"></i>
            </div>
        </div>
        <div class="popupBody">
            <div class="popupForm detailsPopupForm" id="detailsPopupForm">

                <div class="formContent">
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="violationCasePrice" class="customLabel">المبلغ المطلوب سداده</label>
                                        <input class="form-control disabled customInput violationCasePrice" id="violationCasePrice" type="text" value="${functions.splitBigNumbersByComma(totalPrice)}" disabled>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="payCaseAttachment" class="customLabel">إرفاق إيصال السداد * </label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput payCaseAttachment form-control" id="payCaseAttachment" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
                                            </div>
                                        </div>
                                        <div class="dropFilesArea" id="dropFilesArea"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="formButtonsBox">
                    <div class="row">
                        <div class="col-12">
                            <div class="buttonsBox centerButtonsBox">
                                <div class="btnStyle confirmBtnGreen popupBtn payCaseBeforeEditBtn" id="payCaseBeforeEditBtn">تأكيد السداد</div>
                                <div class="btnStyle cancelBtn popupBtn" id="closePayCaseBeforeEditPopupFooter" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>`;

    functions.declarePopup(
        ["generalPopupStyle", "greenPopup", "editPopup"],
        popupHtml
    );

    // Add close button handlers
    $("#closePayCaseBeforeEditPopup, #closePayCaseBeforeEditPopupFooter").on("click", function () {
        functions.closePopup();
    });

    let filesExtension = [
        "gif", "svg", "jpg", "jpeg", "png",
        "doc", "docx", "pdf", "xls", "xlsx", "pptx"
    ];
    let allAttachments;
    let countOfFiles;

    // File attachment handling
    $("#payCaseAttachment").on("change", (e) => {
        allAttachments = $(e.currentTarget)[0].files;
        if (allAttachments.length > 0) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
        }
        for (let i = 0; i < allAttachments.length; i++) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${allAttachments[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
        }

        $(".deleteFile").on("click", (event) => {
            let index = $(event.currentTarget).closest(".file").index();
            $(event.currentTarget).closest(".file").remove();
            let fileBuffer = new DataTransfer();
            for (let i = 0; i < allAttachments.length; i++) {
                if (index !== i) {
                    fileBuffer.items.add(allAttachments[i]);
                }
            }
            allAttachments = fileBuffer.files;
            countOfFiles = allAttachments.length;
            if (countOfFiles == 0) {
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
            }
        });

        for (let i = 0; i < allAttachments.length; i++) {
            let fileSplited = allAttachments[i].name.split(".");
            let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
            if ($.inArray(fileExt, filesExtension) == -1) {
                functions.warningAlert("من فضلك أدخل الملفات بالمرفقات المسموح بها فقط");
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
                $(e.currentTarget).val("");
            }
        }
    });

    $(".payCaseBeforeEditBtn").on("click", (e) => {
        if (allAttachments != null && allAttachments.length > 0) {
            $(".overlay").addClass("active");

            // Calculate actual amount paid (remove commas for calculation)
            let actualAmountPaid = totalPrice.toString().replace(/\,/g, "");

            // FIX: Get caseStatus from the table row directly instead of jQuery selector
            // Look for the violation code element that matches this referral
            let caseStatus = $("#QuarryViolationReferralTable").find(`[data-referralid="${ReferralID}"]`).data('referralstatus');

            // First change task status, then upload attachment in the success callback
            quarryViolationReferral.changeTaskStatusAfterPayCase(
                TaskID,
                ViolationID,
                "#payCaseAttachment",
                parseFloat(actualAmountPaid),
                ReferralID,
                caseStatus,
            );

        } else {
            functions.warningAlert("من فضلك قم بإرفاق إيصال السداد");
        }
    });
};
quarryViolationReferral.payCaseAfterEditPopup = (
    ReferralID,
    ViolationID,
    TaskID,
    referralNumber,
    violationCode,
    totalPrice,
    oldPrice,
    referredAmount
) => {
    $(".overlay").removeClass("active");
    let popupHtml = `
        <div class="popupHeader" style="display: flex; justify-content: space-between;">
            <div class="violationsCode">
                <p>سداد على الإحالة - الإحالة رقم (${violationCode})</p>
            </div>
            <div class="btnStyle cancelBtn popupBtn closePayCaseAfterEditPopup" id="closePayCaseAfterEditPopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
                <i class="fa-solid fa-x"></i>
            </div>
        </div>
        <div class="popupBody">
            <div class="popupForm detailsPopupForm" id="detailsPopupForm">

                <div class="formContent">
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="referredAmountValue" class="customLabel">مبلغ الإحالة</label>
                                        <input class="form-control disabled customInput referredAmountValue" id="referredAmountValue" type="text" value="${functions.splitBigNumbersByComma(totalPrice)}" disabled>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="payCaseAfterEditAttachment" class="customLabel">إرفاق إيصال السداد * </label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput payCaseAfterEditAttachment form-control" id="payCaseAfterEditAttachment" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
                                            </div>
                                        </div>
                                        <div class="dropFilesArea" id="dropFilesArea"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="formButtonsBox">
                    <div class="row">
                        <div class="col-12">
                            <div class="buttonsBox centerButtonsBox">
                                <div class="btnStyle confirmBtnGreen popupBtn payCaseAfterEditBtn" id="payCaseAfterEditBtn">تأكيد السداد</div>
                                <div class="btnStyle cancelBtn popupBtn" id="closePayCaseAfterEditPopupFooter" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>`;

    functions.declarePopup(
        ["generalPopupStyle", "greenPopup", "editPopup"],
        popupHtml
    );

    // Add close button handlers
    $("#closePayCaseAfterEditPopup, #closePayCaseAfterEditPopupFooter").on("click", function () {
        functions.closePopup();
    });

    let filesExtension = [
        "gif", "svg", "jpg", "jpeg", "png",
        "doc", "docx", "pdf", "xls", "xlsx", "pptx"
    ];
    let allAttachments;
    let countOfFiles;

    // File attachment handling
    $("#payCaseAfterEditAttachment").on("change", (e) => {
        allAttachments = $(e.currentTarget)[0].files;
        if (allAttachments.length > 0) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
        }
        for (let i = 0; i < allAttachments.length; i++) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${allAttachments[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
        }

        $(".deleteFile").on("click", (event) => {
            let index = $(event.currentTarget).closest(".file").index();
            $(event.currentTarget).closest(".file").remove();
            let fileBuffer = new DataTransfer();
            for (let i = 0; i < allAttachments.length; i++) {
                if (index !== i) {
                    fileBuffer.items.add(allAttachments[i]);
                }
            }
            allAttachments = fileBuffer.files;
            countOfFiles = allAttachments.length;
            if (countOfFiles == 0) {
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
            }
        });

        for (let i = 0; i < allAttachments.length; i++) {
            let fileSplited = allAttachments[i].name.split(".");
            let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
            if ($.inArray(fileExt, filesExtension) == -1) {
                functions.warningAlert("من فضلك أدخل الملفات بالمرفقات المسموح بها فقط");
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
                $(e.currentTarget).val("");
            }
        }
    });

    $(".payCaseAfterEditBtn").on("click", (e) => {
        if (allAttachments != null && allAttachments.length > 0) {
            $(".overlay").addClass("active");

            let actualAmountPaid = totalPrice.toString().replace(/\,/g, "");

            // FIX: Get caseStatus from the table row directly
            let caseStatus = $("#QuarryViolationReferralTable").find(`[data-referralid="${ReferralID}"]`).data('referralstatus');

            quarryViolationReferral.changeTaskStatusAfterPayCase(
                TaskID,
                ViolationID,
                "#payCaseAfterEditAttachment",
                parseFloat(actualAmountPaid),
                ReferralID,
                caseStatus,
            );
        } else {
            functions.warningAlert("من فضلك قم بإرفاق إيصال السداد");
        }
    });
};
quarryViolationReferral.changeTaskStatusAfterPayCase = (
    TaskID,
    ViolationID,
    attachInput,
    ActualAmountPaid,
    ReferralID,
    caseStatus,
) => {
    // Ensure caseStatus is not undefined or null
    if (!caseStatus) {
        console.warn("Case status is undefined, using default");
        caseStatus = "Paid";
    }

    let request = {
        request: {
            Data: {
                ID: TaskID,
                ViolationId: ViolationID,
                ActualAmountPaid: ActualAmountPaid,
                Status: "Paid",  // Always set task status to Paid
                ReferralStatus: caseStatus  // Use the actual case status from the table
            }
        }
    };

    functions
        .requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save", request)
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            if (data.d && data.d.Status) {
                // After successfully updating task status, upload the attachment
                quarryViolationReferral.uploadTaskAttachment(TaskID, attachInput);
            } else {
                functions.warningAlert("حدث خطأ أثناء تحديث حالة المهمة");
                $(".overlay").removeClass("active");
            }
        })
        .catch((err) => {
            console.error("Error updating task status:", err);
            $(".overlay").removeClass("active");
            functions.warningAlert("حدث خطأ أثناء عملية السداد");
        });
};
quarryViolationReferral.uploadTaskAttachment = (TaskId, attachInput, ListName = "ViolationsCycle") => {
    let Data = new FormData();
    Data.append("itemId", TaskId);
    Data.append("listName", ListName);

    // Use the exact same pattern as runningSectorTask
    let filesInput = $(attachInput)[0];
    for (let i = 0; i <= filesInput.files.length; i++) {
        Data.append("file" + i, filesInput.files[i]);
    }

    $.ajax({
        type: "POST",
        url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
        processData: false,
        contentType: false,
        data: Data,
        success: (data) => {
            $(".overlay").removeClass("active");
            functions.sucessAlert("تم السداد بنجاح");
            functions.closePopup();
        },
        error: (err) => {
            functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
            $(".overlay").removeClass("active");
            console.log(err.responseText);
        },
    });
};

///////////////////////////////////////


// ========== Save Case and Cancel Violation Functions ==========
quarryViolationReferral.saveCaseAndCancelViolationPopup = (
    ReferralID,
    ViolationID,
    TaskID,
    referralNumber,
    violationCode,
    caseStatus
) => {
    $(".overlay").removeClass("active");

    let title = violationCode
        ? `حفظ القضية وإلغاء المخالفة - المخالفة رقم (${violationCode})`
        : `حفظ القضية وإلغاء المخالفة`;

    let popupHtml = `
        <div class="popupHeader" style="display: flex; justify-content: space-between;">
            <div class="violationsCode">
                <p>${title}</p>
            </div>
            <div class="btnStyle cancelBtn popupBtn closeSaveCasePopup" id="closeSaveCasePopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
                <i class="fa-solid fa-x"></i>
            </div>
        </div>
        <div class="popupBody">
            <div class="popupForm detailsPopupForm" id="detailsPopupForm">
                <div class="formContent">
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="form-group customFormGroup">
                                        <label for="saveCaseComments" class="customLabel">ملاحظات</label>
                                        <textarea class="form-control customTextArea saveCaseComments" id="saveCaseComments" rows="3" placeholder="أدخل الملاحظات"></textarea>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="saveCaseAttachment" class="customLabel">إرفاق المستندات <span style="color: red;">*</span></label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput saveCaseAttachment form-control" id="saveCaseAttachment" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
                                            </div>
                                        </div>
                                        <div class="dropFilesArea" id="dropFilesArea"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="formButtonsBox">
                    <div class="row">
                        <div class="col-12">
                            <div class="buttonsBox centerButtonsBox">
                                <div class="btnStyle confirmBtnGreen popupBtn confirmSaveCaseBtn" id="confirmSaveCaseBtn">تأكيد</div>
                                <div class="btnStyle cancelBtn popupBtn closeSaveCasePopupFooter" id="closeSaveCasePopupFooter" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    functions.declarePopup(
        ["generalPopupStyle", "greenPopup", "editPopup"],
        popupHtml
    );

    // Add close button handlers
    $("#closeSaveCasePopup, #closeSaveCasePopupFooter").on("click", function () {
        functions.closePopup();
    });

    let filesExtension = [
        "gif", "svg", "jpg", "jpeg", "png",
        "doc", "docx", "pdf", "xls", "xlsx", "pptx"
    ];
    let allAttachments;
    let countOfFiles;
    let SaveCaseCommentsInput = "";

    // Handle comments input
    $("#saveCaseComments").on("input", (e) => {
        SaveCaseCommentsInput = $(e.currentTarget).val().trim();
    });

    // File attachment handling
    $("#saveCaseAttachment").on("change", (e) => {
        allAttachments = $(e.currentTarget)[0].files;
        if (allAttachments.length > 0) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
        }
        for (let i = 0; i < allAttachments.length; i++) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${allAttachments[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
        }

        $(".deleteFile").on("click", (event) => {
            let index = $(event.currentTarget).closest(".file").index();
            $(event.currentTarget).closest(".file").remove();
            let fileBuffer = new DataTransfer();
            for (let i = 0; i < allAttachments.length; i++) {
                if (index !== i) {
                    fileBuffer.items.add(allAttachments[i]);
                }
            }
            allAttachments = fileBuffer.files;
            countOfFiles = allAttachments.length;
            if (countOfFiles == 0) {
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
            }
        });

        for (let i = 0; i < allAttachments.length; i++) {
            let fileSplited = allAttachments[i].name.split(".");
            let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
            if ($.inArray(fileExt, filesExtension) == -1) {
                functions.warningAlert("من فضلك أدخل الملفات بالمرفقات المسموح بها فقط");
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
                $(e.currentTarget).val("");
            }
        }
    });

    // Confirm Save Case button handler
    $("#confirmSaveCaseBtn").on("click", (e) => {
        if (allAttachments != null && allAttachments.length > 0) {
            $(".overlay").addClass("active");
            quarryViolationReferral.saveCase(ReferralID, ViolationID, TaskID, SaveCaseCommentsInput, "#saveCaseAttachment");
        } else {
            functions.warningAlert("من فضلك قم بإرفاق المستندات المطلوبة");
        }
    });
};

quarryViolationReferral.saveCase = (ReferralID, ViolationID, TaskID, Comments, attachInput) => {
    // Step 1: Save the case with status "محفوظة"
    let saveCaseRequest = {
        Request: {
            ID: ReferralID,
            Status: "محفوظة",
            Title: "تم حفظ القضية",
            Comments: Comments
        }
    };

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/Save",
            saveCaseRequest
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            if (data.d && data.d.Status) {
                // Step 2: Upload the attachment for save case
                quarryViolationReferral.saveCaseAttachmentAndCancelViolation(
                    ReferralID,
                    ViolationID,
                    TaskID,
                    Comments,
                    attachInput
                );

                // // Update violation task status first
                // quarryViolationReferral.updateViolationTaskStatus(TaskID, ViolationID, "محفوظة")
                //     .then(() => {
                //         // Then upload the attachment for save case
                //         quarryViolationReferral.saveCaseAttachmentAndCancelViolation(
                //             ReferralID,
                //             ViolationID,
                //             TaskID,
                //             Comments,
                //             attachInput
                //         );
                //     });
            } else {
                $(".overlay").removeClass("active");
                functions.warningAlert("حدث خطأ أثناء حفظ القضية");
            }
        })
        .catch((err) => {
            console.error("Error saving case:", err);
            $(".overlay").removeClass("active");
            functions.warningAlert("حدث خطأ أثناء حفظ القضية");
        });
};

quarryViolationReferral.saveCaseAttachmentAndCancelViolation = (
    ReferralID,
    ViolationID,
    TaskID,
    Comments,
    attachInput
) => {
    // Create attachment record first
    let request = {
        Request: {
            Title: "مستند حفظ القضية",
            CaseId: ReferralID,
            UploadPhase: "حفظ القضية",
            Comments: Comments,
        },
    };

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/CaseAttachments.aspx/Save",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            if (data.d.Status) {
                quarryViolationReferral.cancelViolation(ReferralID, ViolationID, TaskID);

                // let RecordId = data.d.Result.Id;
                // // Upload the attachment
                // quarryViolationReferral.uploadSaveCaseAttachments(
                //     RecordId,
                //     attachInput,
                //     "CasesAttachments",
                //     ReferralID,
                //     ViolationID,
                //     TaskID
                // );
            } else {
                $(".overlay").removeClass("active");
                functions.warningAlert("هناك خطأ في حفظ المرفقات");
            }
        })
        .catch((err) => {
            console.error(err);
            $(".overlay").removeClass("active");
            functions.warningAlert("حدث خطأ في الاتصال بالخادم");
        });
};

quarryViolationReferral.cancelViolation = (ReferralID, ViolationID, TaskID) => {
    // Cancel the violation task
    let cancelViolationRequest = {
        request: {
            Data: {
                ID: TaskID,
                ViolationId: ViolationID,
                Status: "Cancelled",
                ReferralStatus: "محفوظة"
            }
        }
    };

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save",
            cancelViolationRequest
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            $(".overlay").removeClass("active");

            if (data.d && data.d.Status) {
                functions.sucessAlert("تم حفظ القضية وإلغاء المخالفة بنجاح");
                functions.closePopup();
            } else {
                functions.warningAlert("تم حفظ القضية ولكن حدث خطأ أثناء إلغاء المخالفة");
            }
        })
        .catch((err) => {
            console.error("Error canceling violation:", err);
            $(".overlay").removeClass("active");
            functions.warningAlert("تم حفظ القضية ولكن حدث خطأ أثناء إلغاء المخالفة");
        });
};
////////////////// update Violation TaskStatus function //////////////////////////
quarryViolationReferral.updateViolationTaskStatus = (TaskID, ViolationID, CaseStatus) => {
    let request = {
        request: {
            Data: {
                ID: TaskID,
                ViolationId: ViolationID,
                ReferralStatus: CaseStatus,
                Status: "تعديل حالات القضية",
            }
        }
    };

    return functions.requester(
        "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save",
        request
    )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            if (data.d && data.d.Status) {
                return true;
            } else {
                console.error("Failed to update violation task status");
                return false;
            }
        })
        .catch((err) => {
            console.error("Error updating violation task status:", err);
            return false;
        });
};
/////////////////////////////////////

const ViolationHistoryLogs = () => {
    let selectedViolationId = null;
    let selectedViolationCode = null;
    let trackHistoryTable = null;

    // ===============================
    //  فتح المودال
    // ===============================
    $(".contentContainer").on("click", ".violationHistory", function (e) {
        e.preventDefault();
        e.stopPropagation();

        selectedViolationId = $(this).data("violationid");
        selectedViolationCode = $(this).data("violationcode");

        $("#trackHistoryModal").modal("show");
    });

    // ===============================
    //  إغلاق المودال - Close button handlers
    // ===============================
    const closeModal = () => {
        $("#trackHistoryModal").modal("hide");

        // Clear the modal content
        $(".track-history-violation-code").text("");
        if (trackHistoryTable) {
            trackHistoryTable.clear().destroy();
            trackHistoryTable = null;
        }
        $("#trackHistoryTable tbody").empty();
    };

    $(document).on("click", "#closeViolationHistoryPopup", function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
    });

    // // Close button in footer
    // $(document).on("click", "#closeViolationHistoryPopupFooter", function (e) {
    //   e.preventDefault();
    //   e.stopPropagation();
    //   closeModal();
    // });

    // Bootstrap modal hide event
    $("#trackHistoryModal").on("hidden.bs.modal", function () {
        closeModal();
    });

    // ===============================
    //  لما المودال يفتح
    // ===============================
    $(".track-history-modal").on("shown.bs.modal", function () {
        $(".track-history-violation-code").text(selectedViolationCode);

        const request = {
            Request: {
                ViolationId: selectedViolationId,
            },
        };

        const tableElement = $("#trackHistoryTable");

        if (!trackHistoryTable) {
            trackHistoryTable = tableElement.DataTable({
                processing: true,
                paging: false,
                responsive: true,
                destroy: true,
                ajax: {
                    url: "/_layouts/15/Uranium.Violations.SharePoint/ViolationHistoryLogs.aspx/Search",
                    type: "POST",
                    contentType: "application/json",
                    data: () => JSON.stringify(request),
                    dataSrc: (data) => {
                        return data?.d?.Result?.GridData || [];
                    }
                },
                columns: [
                    { data: null, render: (data, type, row, meta) => meta.row },
                    { data: "Status", render: (data) => data || "-" },
                    { data: "Created", render: (data) => data ? functions.getFormatedDate(data) : "-" },
                    { data: "CreatedBy", render: (data) => data || "-" },
                    { data: "Comment", render: (data) => data || "-" }
                ],
                language: { emptyTable: "لا توجد بيانات" }
            });
        } else {
            trackHistoryTable.ajax.reload();
        }
    });

    // ===============================
    //  لما المودال يقفل
    // ===============================
    $(".track-history-modal").on("hidden.bs.modal", function () {
        $(".track-history-violation-code").text("");
        if (trackHistoryTable) {
            trackHistoryTable.clear().destroy();
            trackHistoryTable = null;
        }
        $("#trackHistoryTable tbody").empty();
    });
};

ViolationHistoryLogs();



///////////////////////////////////////////////////
// quarryViolationReferral.init = () => {
//     // // Setup event listeners
//     // $(".searchBtn").off("click").on("click", quarryViolationReferral.filterQuarryViolationReferrals);

//     // // Reset button handler
//     // $(".resetBtn").off("click").on("click", quarryViolationReferral.resetFilter);

//     // $(".filterBox input").off("keypress").on("keypress", function (e) {
//     //     if (e.which === 13) {
//     //         quarryViolationReferral.filterQuarryViolationReferrals(e);
//     //     }
//     // });

//     // Load initial data
//     $(".overlay").addClass("active");
//     quarryViolationReferral.getQuarryViolationReferrals();
// };

// quarryViolationReferral.getQuarryViolationReferrals = (
//     pageIndex = 1,
//     destroyTable = false,
//     ReferralNumber = $("#CaseNumber").val(),
//     CaseStatus = $("#CaseStatus").children("option:selected").val(),
// ) => {
// $(document).ready(function () {
//     if (functions.getPageName() === "QuarryViolationReferralLog") {
//         quarryViolationReferral.init();
//     }
// });

export default quarryViolationReferral;