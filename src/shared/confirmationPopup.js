import functions from "./functions";

let confirmPopup = {};

// confirmPopup.updateTaskStatusPopup(violationTaskID,violationCode,"Reffer");
// confirmPopup.updateTaskStatusPopup(violationTaskID,violationCode,"Kill");

confirmPopup.updateTaskStatusPopup = (violationTaskID, violationCode, Type) => {
  $(".overlay").removeClass("active");
  let popupHtml = ``;
  let popupTitle = ``;
  let popupMessage = ``;

  if (Type == "Reffer") {
    popupTitle = `إحالة المخالفة رقم ${violationCode}`;
    popupMessage = `هل أنت متأكد من إحالة المخالفة رقم ${violationCode} لإدارة المدعي العام العسكري؟`;
  } else if (Type == "Kill") {
    popupTitle = `إعدام المخالفة رقم ${violationCode}`;
    popupMessage = `هل حقاً تريد إعدام المخالفة رقم ${violationCode} ؟`;
  } else if (Type == "Approve") {
    popupTitle = `قبول المخالفة رقم ${violationCode}`;
    popupMessage = `هل حقاً تريد تأكيد قبول المخالفة رقم ${violationCode} ؟`;
  }

  popupHtml = `
        <div class="popupHeader">
            <div class="violationsCode"> 
                <p>${popupTitle}</p>
            </div>
        </div>
        <div class="popupBody">
            <div class="confirmStatusPopup" id="confirmStatusPopup">
                <div class="popupContent">
                    <p class="popupMessage">${popupMessage}</p>
                </div>
                <div class="formButtonsBox">
                    <div class="row">
                        <div class="col-12">
                            <div class="buttonsBox centerButtonsBox ">
                                <div class="btnStyle confirmBtnGreen popupBtn confirmEditStatus" id="confirmEditStatus">تأكيد</div>
                                <div class="btnStyle cancelBtn popupBtn closeDetailsPopup" id="closeDetailsPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
  functions.declarePopup(
    ["generalPopupStyle", "greenPopup", "statusPopup"],
    popupHtml
  );

  $(".confirmEditStatus").on("click", (e) => {
    e.preventDefault();
    $(".overlay").addClass("active");
    confirmPopup.confirmTaskStatus(violationTaskID, Type);
  });
};
confirmPopup.confirmTaskStatus = (violationTaskID, Type) => {
  let sucessMessage = "";
  if (Type == "Reffer") {
    sucessMessage = "تم إحالة الطلب بنجاح";
  } else if (Type == "Kill") {
    sucessMessage = "تم إعدام الطلب";
  } else if (Type == "Approve") {
    sucessMessage = "تم الموافقة على الطلب";
  }
  let request = {
    Data: {
      ID: violationTaskID,
      Title: "مهمة جديدة",
      // Status: Type == "Kill"?"Reffered":Type == "Reffer"?"Confirmed":"Approved",
      Status: Type == "Approve" ? "Approved" : "Confirmed",
      PaymentStatus:
        Type == "Kill"
          ? "معدومة"
          : Type == "Reffer"
          ? "تم الإحالة"
          : "قيد الإنتظار",
    },
  };
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
      console.log(data);
      $(".overlay").removeClass("active");
      functions.sucessAlert(sucessMessage);
    })
    .catch((err) => {
      console.log(err);
    });
};

export default confirmPopup;
