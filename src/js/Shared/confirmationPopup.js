import PendingViolations from "../Modules/ViolationsBranch/PendingViolations";
import functions from "./functions";

let confirmPopup = {};


confirmPopup.updateTaskStatusPopup = (violationTaskID,violationCode,violationId,Type,TotalPrice = 0,offenderType="")=>{
    $(".overlay").removeClass("active");
    let popupHtml = ``
    let popupTitle = ``;
    let popupMessage = ``;
    // if(Type == "Reffer"){
    //     popupTitle = `إحالة المخالفة رقم (${violationCode})`
    //     popupMessage = `هل أنت متأكد من إحالة المخالفة رقم (${violationCode}) لإدارة المدعي العام العسكري؟`;
    // }

    // if(Type == "Kill"){
    //     popupTitle = `إعدام المخالفة رقم (${violationCode})`
    //     popupMessage = `هل حقاً تريد إعدام المخالفة رقم (${violationCode}) ؟`;
    // }
    
    if(Type == "Approve"){
        popupTitle = `قبول المخالفة رقم (${violationCode})`
        popupMessage = `هل حقاً تريد تأكيد قبول المخالفة رقم (${violationCode}) ؟`;
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
    functions.declarePopup(["generalPopupStyle", "greenPopup", "statusPopup"],popupHtml);

    $(".confirmEditStatus").on("click",(e)=>{
        e.preventDefault()
        $(".overlay").addClass("active");
        confirmPopup.confirmTaskStatus(violationTaskID,violationId,Type,TotalPrice,offenderType)
    })
}
confirmPopup.confirmTaskStatus = (violationTaskID,violationId,Type,TotalPrice = 0,offenderType="")=>{
    let request;
    let sucessMessage = "";
    let Title = "";
    let DouplePrice;
    // if(Type == "Reffer"){
    //     sucessMessage = "تم إحالة المخالفة وتسجيلها في سجل القضايا"
    //     Title="تم إحالة الطلب"
    //     DouplePrice = TotalPrice * 2;
    //     request = {
    //         Data:{
    //             ID:violationTaskID,
    //             Title: Title,
    //             Status: "Reffered",
    //             ViolationId:violationId,
    //             TotalPriceDue:offenderType == "Quarry"?TotalPrice:DouplePrice,
    //             PaymentStatus: "تم الإحالة",
    //         }
    //     }
    // }
    if(Type == "Kill"){
        sucessMessage = "تم إعدام الطلب"
        Title="تم إعدام الطلب"
        request = {
            Data:{
                ID:violationTaskID,
                Title: Title,
                Status: "Confirmed",
                ViolationId:violationId,
                PaymentStatus: "معدومة",
            }
        }
    }
    if(Type == "Approve"){
        sucessMessage = "تم الموافقة على الطلب"
        Title="تم الموافقة على الطلب"
        request = {
            Data:{
                ID:violationTaskID,
                Title: Title,
                Status: "Approved",
                ViolationId:violationId,
                PaymentStatus: "قيد الإنتظار",
            }
        }
    }
    functions.requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save", {request})
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
        // if(Type == "Reffer"){
        //     confirmPopup.addNewCase(violationId,sucessMessage)
        // }else{
            $(".overlay").removeClass("active");
            functions.sucessAlert(sucessMessage);
        // }
    })
    .catch((err) => {
      console.log(err);
    });
};

// confirmPopup.addNewCase = (violationId,Message) => {
//     let request = {
//         Request :{
//             Title: "قضية مسجلة من مخالفة",
//             Status: "قيد مراجعة النيابة المختصة",
//             ViolationId:violationId,
//             CaseNumber:"add from reffered"
//         }
//     }
//     functions.requester("/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/Save", request)
//     .then((response) => {
//       if (response.ok) {
//         return response.json();
//       }
//     })
//     .then((data) => {
//         $(".overlay").removeClass("active");
//         functions.sucessAlert(Message);
//     })
//     .catch((err) => {
//       console.log(err);
//     });
// }

export default confirmPopup;
