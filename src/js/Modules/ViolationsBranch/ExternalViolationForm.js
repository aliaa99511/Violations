import Swal from "sweetalert2";
import functions from "../../Shared/functions";
import sharedApis from "../../Shared/sharedApiCall";

let externalViolationForm = {};
var urlParams = new URLSearchParams(window.location.search);
var editViolationId;

externalViolationForm.violatorDetails = () => {
    let vaildViolator = false;
    let violatorDetails = {};
    let violatorName = $("#violatorName").val();
    let companyName = $("#companyName").val();
    let violationGov = $("#violationGov").children("option:selected").val();
    let violationGovId = $("#violationGov").children("option:selected").data("id");
    let violationsZone = $("#violationsZone").val();
    let assignedProsecution = $("#assignedProsecution").children("option:selected").val();

    if (violatorName && violatorName.trim() !== "") {
        if (violationGov && violationGov !== "") {
            if (assignedProsecution && assignedProsecution !== "") {
                violatorDetails = {
                    violatorName: violatorName.trim(),
                    companyName: companyName && companyName.trim() !== "" ? companyName.trim() : "",
                    violationGov: violationGovId,
                    violationGovText: violationGov,
                    violationsZone: violationsZone && violationsZone.trim() !== "" ? violationsZone.trim() : "",
                    assignedProsecution: assignedProsecution,
                };
                vaildViolator = true;
            } else {
                functions.warningAlert("من فضلك قم باختيار النيابة المختصة", "#assignedProsecution");
            }
        } else {
            functions.warningAlert("من فضلك قم باختيار المحافظة", "#violationGov");
        }
    } else {
        functions.warningAlert("من فضلك قم بادخال اسم المخالف", "#violatorName");
    }

    if (vaildViolator) {
        return violatorDetails;
    } else {
        return vaildViolator;
    }
};

externalViolationForm.violationDetails = () => {
    let violationsData = {};
    let validViolation = false;
    let offenderType = $("#offenderType").children("option:selected").val();
    let offenderTypeId = $("#offenderType").children("option:selected").data("id");
    let violationType = $("#violationType").children("option:selected").val();
    let violationTypeId = $("#violationType").children("option:selected").data("id");
    let violationDate = $("#violationDate").val();
    let caseNumber = $("#caseNumber").val();

    if (offenderType && offenderType !== "") {
        if (violationType && violationType !== "") {
            if (violationDate && violationDate !== "") {
                if (caseNumber && caseNumber.trim() !== "") {
                    violationsData = {
                        offenderType: offenderTypeId,
                        offenderTypeText: offenderType,
                        violationType: violationTypeId,
                        violationTypeText: violationType,
                        violationDate: violationDate, // Just the date without time
                        caseNumber: caseNumber.trim(),
                        rawViolationDate: violationDate
                    };
                    validViolation = true;
                } else {
                    functions.warningAlert("من فضلك قم بادخال رقم القضية", "#caseNumber");
                }
            } else {
                functions.warningAlert("من فضلك قم بتحديد تاريخ الضبط", "#violationDate");
            }
        } else {
            functions.warningAlert("من فضلك قم باختيار نوع المخالفة", "#violationType");
        }
    } else {
        functions.warningAlert("من فضلك قم باختيار تصنيف المخالفة", "#offenderType");
    }

    if (validViolation) {
        return violationsData;
    } else {
        return validViolation;
    }
};

externalViolationForm.formActions = () => {
    let numberOfDaysBefore = functions.getViolationStartDate(3);
    functions.inputDateFormat(
        ".inputDate",
        numberOfDaysBefore,
        "today",
        "dd/mm/yyyy"
    );

    // Initialize date picker
    $(".inputDate").datepicker({
        dateFormat: "dd-mm-yy",
        changeMonth: true,
        changeYear: true,
        yearRange: "-100:+0",
        onSelect: function (dateText) {
            $(this).trigger('change');
        }
    });

    // Number validation for case number
    $(".caseNumber").on("keypress", (e) => {
        return functions.isNumberKey(e);
    });

    // Form submission
    $("#submitExternalViolation").on("click", (e) => {
        externalViolationForm.validateForm(e);
    });

    // Cancel button
    $("#cancelExternalViolation").on("click", (e) => {
        window.location.href = "/ViolationsBranch/Pages/ExternalViolationsList.aspx";
    });

    // File upload handling
    let filesExtension = [
        "gif", "svg", "jpg", "jpeg", "png",
        "doc", "docx", "pdf", "xls", "xlsx", "pptx"
    ];

    $(".dropFilesArea").hide();

    let violationFiles;
    $(".attachViolationFiles").on("change", (e) => {
        violationFiles = $(e.currentTarget)[0].files;

        if (violationFiles.length > 0) {
            $(e.currentTarget)
                .parents(".fileBox")
                .siblings(".dropFilesArea")
                .show()
                .empty();
        }

        for (let i = 0; i < violationFiles.length; i++) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${violationFiles[i].name}</p>
                    <span class="deleteFile" data-index="${i}">
                        <i class="fa-sharp fa-solid fa-x"></i>
                    </span>
                </div>
            `);
        }

        $(".deleteFile").on("click", (event) => {
            let index = $(event.currentTarget).closest(".file").index();
            $(event.currentTarget).closest(".file").remove();

            let fileBuffer = new DataTransfer();
            for (let i = 0; i < violationFiles.length; i++) {
                if (index !== i) {
                    fileBuffer.items.add(violationFiles[i]);
                }
            }
            violationFiles = fileBuffer.files;

            if (violationFiles.length == 0) {
                $(event.currentTarget)
                    .parents(".fileBox")
                    .siblings(".dropFilesArea")
                    .hide();
            }
        });

        // Validate file extensions
        for (let i = 0; i < violationFiles.length; i++) {
            let fileSplited = violationFiles[i].name.split(".");
            let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
            if ($.inArray(fileExt, filesExtension) == -1) {
                functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط");
                $(e.currentTarget)
                    .parents(".fileBox")
                    .siblings(".dropFilesArea")
                    .hide();
                $(e.currentTarget).val("");
                break;
            }
        }
    });

    // Enable drag and drop
    let dropContainer = document.getElementById('dropContainer');
    if (dropContainer) {
        dropContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropContainer.style.borderColor = '#007bff';
        });

        dropContainer.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropContainer.style.borderColor = '#ccc';
        });

        dropContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropContainer.style.borderColor = '#ccc';

            let files = e.dataTransfer.files;
            if (files.length > 0) {
                let dataTransfer = new DataTransfer();
                for (let i = 0; i < files.length; i++) {
                    dataTransfer.items.add(files[i]);
                }
                $("#attachViolationFiles")[0].files = dataTransfer.files;
                $("#attachViolationFiles").trigger('change');
            }
        });
    }
};

externalViolationForm.getOffenderTypes = () => {
    return new Promise((resolve, reject) => {
        $("#offenderType").empty().append(`
            <option value="" disabled selected hidden>
                تصنيف المخالفة
            </option>
        `);

        sharedApis.getOffenderType("#offenderType")
            .then(() => {
                resolve();
            })
            .catch((error) => {
                console.error("Error loading offender types:", error);
                reject(error);
            });
    });
};

externalViolationForm.getViolationTypes = () => {
    return new Promise((resolve, reject) => {
        $("#violationType").empty().append(`
            <option value="" disabled selected hidden>
                نوع المخالفة
            </option>
        `);

        sharedApis.getViolationType("#violationType")
            .then(() => {
                resolve();
            })
            .catch((error) => {
                console.error("Error loading violation types:", error);
                reject(error);
            });
    });
};

externalViolationForm.getProsecutions = () => {
    return sharedApis.getProsecutions("#assignedProsecution");
};

externalViolationForm.validateForm = (e) => {
    e.preventDefault();

    let ViolationData = {};
    let violatorDetails = externalViolationForm.violatorDetails();
    let violationDetails = externalViolationForm.violationDetails();

    if (violatorDetails != false && violationDetails != false) {
        // Format the date properly for SharePoint
        let formattedDate = "";
        if (violationDetails.rawViolationDate) {
            let dateParts = violationDetails.rawViolationDate.split("-");
            if (dateParts.length === 3) {
                formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                formattedDate += "T00:00:00"; // Default time since time field is removed
            }
        }

        // Prepare data for API
        ViolationData = {
            // For editing
            ID: urlParams.get("taskId") !== null ? parseInt(editViolationId) : 0,

            // Required fields for external violation
            Title: "مخالفة خارجية",
            Governrate: parseInt(violatorDetails.violationGov),
            ViolationsZone: violatorDetails.violationsZone,
            ViolatorName: violatorDetails.violatorName,
            ViolatorCompany: violatorDetails.companyName,
            CaseNumber: violationDetails.caseNumber,
            AssignedProsecution: violatorDetails.assignedProsecution,
            PublicProsecution: violatorDetails.assignedProsecution,
            ViolationDate: formattedDate,
            OffenderType: parseInt(violationDetails.offenderType),
            ViolationType: parseInt(violationDetails.violationType),
            IsExternalRecord: true,
            Status: "قيد المعالجة"
        };

        console.log("Submitting data:", ViolationData);

        externalViolationForm.submitNewViolation(e, ViolationData);
    }
};

externalViolationForm.submitNewViolation = (e, ViolationData) => {
    $(".overlay").addClass("active");

    let request = {
        Data: ViolationData,
        IsEdit: urlParams.get("taskId") !== null
    };

    console.log("API Request:", request);

    functions.requester(
        "/_layouts/15/Uranium.Violations.SharePoint/Violations.aspx/Save",
        request
    )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Network response was not ok');
        })
        .then((data) => {
            console.log("Save response:", data);

            if (data.d && data.d.Status) {
                let ViolationId = data.d.Result.Id;

                // Upload attachments if there are any
                let files = $("#attachViolationFiles")[0].files;
                if (files && files.length > 0) {
                    externalViolationForm.uploadAttachment(ViolationId, "Violations");
                } else {
                    $(".overlay").removeClass("active");
                    functions.sucessAlert(
                        urlParams.get("taskId") ? "تم تعديل مخالفة خارجية بنجاح" : "تم إضافة مخالفة خارجية جديدة بنجاح",
                        false,
                        "/ViolationsBranch/Pages/ExternalViolationsList.aspx"
                    );
                }
            } else {
                $(".overlay").removeClass("active");
                let errorMsg = data.d && data.d.Message ? data.d.Message : "حدث خطأ ما, لم يتم إضافة المخالفة";
                functions.warningAlert(errorMsg);
            }
        })
        .catch((err) => {
            $(".overlay").removeClass("active");
            console.error("Save error:", err);
            functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات: " + err.message);
        });
};

externalViolationForm.uploadAttachment = (NewViolationID, ListName) => {
    $(".overlay").addClass("active");
    let Data = new FormData();
    Data.append("itemId", NewViolationID);
    Data.append("listName", ListName);
    Data.append("Method", urlParams.get("taskId") !== null ? "Edit" : "New");

    let files = $("#attachViolationFiles")[0].files;
    for (let i = 0; i < files.length; i++) {
        Data.append("file" + i, files[i]);
    }

    $.ajax({
        type: "POST",
        url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
        processData: false,
        contentType: false,
        data: Data,
        success: (data) => {
            $(".overlay").removeClass("active");
            try {
                let response = JSON.parse(data);
                if (response.d && response.d.Status) {
                    functions.sucessAlert(
                        urlParams.get("taskId") ? "تم تعديل مخالفة خارجية بنجاح" : "تم إضافة مخالفة خارجية جديدة بنجاح",
                        false,
                        "/ViolationsBranch/Pages/ExternalViolationsList.aspx"
                    );
                } else {
                    functions.warningAlert("حدث خطأ أثناء رفع الملفات");
                }
            } catch (e) {
                functions.warningAlert("خطأ في استجابة الخادم");
            }
        },
        error: (err) => {
            $(".overlay").removeClass("active");
            functions.warningAlert("خطأ في إرسال الملفات");
            console.error(err.responseText);
        }
    });
};

externalViolationForm.editViolation = () => {
    if (urlParams.get("taskId") !== null) {
        $(".PreLoader").addClass("active");

        functions.requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/FindbyId",
            {
                Id: urlParams.get("taskId"),
            }
        )
            .then((response) => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Network response was not ok');
            })
            .then((data) => {
                console.log("Edit data loaded:", data);

                if (data.d && data.d.Violation) {
                    let violationData = data.d.Violation;
                    editViolationId = data.d.ViolationId;

                    // Populate form fields with existing data
                    $("#violatorName").val(violationData.ViolatorName || "");
                    $("#companyName").val(violationData.ViolatorCompany || "");
                    $("#violationsZone").val(violationData.ViolationsZone || "");
                    $("#caseNumber").val(violationData.CaseNumber || "");

                    // Set dropdown values - wait for dropdowns to be populated
                    setTimeout(() => {
                        // Set governorate
                        if (violationData.Governrate) {
                            $(`#violationGov option[data-id="${violationData.Governrate}"]`).prop('selected', true);
                        }

                        // Set prosecution - now using value only (no data-id)
                        if (violationData.AssignedProsecution) {
                            let prosecutionOption = $(`#assignedProsecution option[value="${violationData.AssignedProsecution}"]`);
                            if (prosecutionOption.length > 0) {
                                prosecutionOption.prop('selected', true);
                            } else {
                                // If not found in dropdown, add it as a new option
                                $("#assignedProsecution").append(`
                                    <option value="${violationData.AssignedProsecution}" selected>
                                        ${violationData.AssignedProsecution}
                                    </option>
                                `);
                            }
                        }

                        // Set offender type
                        if (violationData.OffenderType) {
                            $(`#offenderType option[data-id="${violationData.OffenderType}"]`).prop('selected', true);
                        }

                        // Set violation type
                        if (violationData.ViolationType) {
                            $(`#violationType option[data-id="${violationData.ViolationType}"]`).prop('selected', true);
                        }
                    }, 500);

                    // Set date
                    if (violationData.ViolationDate) {
                        try {
                            let date = new Date(violationData.ViolationDate);
                            if (!isNaN(date.getTime())) {
                                let formattedDate = date.getDate().toString().padStart(2, '0') + '-' +
                                    (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
                                    date.getFullYear();
                                $("#violationDate").val(formattedDate);
                            }
                        } catch (e) {
                            console.error("Error parsing date:", e);
                        }
                    }

                    // Load existing attachments if any
                    if (data.d.Attachments && data.d.Attachments.length > 0) {
                        externalViolationForm.loadExistingAttachments(data.d.Attachments);
                    }
                } else {
                    functions.warningAlert("لم يتم العثور على بيانات المخالفة");
                }

                $(".PreLoader").removeClass("active");
            })
            .catch((error) => {
                $(".PreLoader").removeClass("active");
                console.error("Error loading violation data:", error);
                functions.warningAlert("حدث خطأ أثناء تحميل بيانات المخالفة");
            });
    }
};

externalViolationForm.loadExistingAttachments = (attachments) => {
    if (attachments && attachments.length > 0) {
        $(".dropFilesArea").show().empty();

        attachments.forEach((attachment, index) => {
            $(".dropFilesArea").append(`
                <div class="file existing-attachment" data-filename="${attachment.FileName}">
                    <p class="fileName">${attachment.FileName}</p>
                    <span class="existing-file-indicator" title="ملف مرفق مسبقاً">
                        <i class="fa-solid fa-check-circle" style="color: #28a745;"></i>
                    </span>
                </div>
            `);
        });

        // Show a message that existing files cannot be deleted from here
        $(".dropFilesArea").append(`
            <div class="existing-files-note" style="font-size: 12px; color: #666; margin-top: 10px;">
                ملاحظة: الملفات الموجودة مرفوعة بالفعل في النظام ولا يمكن حذفها من هنا
            </div>
        `);
    }
};

externalViolationForm.init = () => {
    $(document).ready(function () {
        externalViolationForm.formActions();

        // Show loading
        $(".PreLoader").addClass("active");

        // Load all dropdowns consistently
        Promise.all([
            sharedApis.getGovernrates("#violationGov"),
            sharedApis.getViolationType("#violationType"),
            sharedApis.getOffenderType("#offenderType"),
            sharedApis.getProsecutions("#assignedProsecution") // Using the updated version
        ])
            .then(() => {
                console.log("All dropdowns loaded successfully");

                // Check for edit mode
                if (urlParams.get("taskId") !== null) {
                    externalViolationForm.editViolation();
                }

                $(".PreLoader").removeClass("active");
            })
            .catch((error) => {
                console.error("Error loading dropdowns:", error);
                $(".PreLoader").removeClass("active");
                functions.warningAlert("حدث خطأ أثناء تحميل البيانات الأساسية");
            });
    });
};
// Initialize the form
externalViolationForm.init();

export default externalViolationForm;