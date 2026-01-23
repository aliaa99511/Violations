// import $ from "jquery";
// import $ from './Libraries/jquery'
//var dt = require("datatables.net")(window, $);
// import Swal from 'sweetalert2';
import bootpopup from "./Libraries/bootpopup";
import functions from "./Shared/functions";
import sharedApis from "./Shared/sharedApiCall";
import dojoConfig from "./dojo";

// Modules ----------------------------------------------------------------
import home from "./Modules/Home";
import quarryViolation from "./Modules/ViolationsRecorder/quarryViolationForm";
import violationRecords from "./Modules/ViolationsRecorder/registeredViolationsRecords";
import carViolation from "./Modules/ViolationsRecorder/carViolations";
import PendingViolations from "./Modules/ViolationsBranch/PendingViolations";
import runningViolations from "./Modules/ViolationsBranch/RunningViolations";
import validatedViolations from "./Modules/ViolationsBranch/ValidatedViolations";
import rejectedViolations from "./Modules/ViolationsBranch/RejectedViolations";
import runningSectorTask from "./Modules/SectorManager/RunningTasks";
import confirmedViolationLog from "./Modules/SectorManager/ConfirmedViolationLog";

if (functions.getSiteName() === "Home") {
  home.redirectUser();
} else if (functions.getSiteName() === "Recorder") {
  sharedApis.getUserDetails();
  $(".SideMenu")
    .find(".userBackImageBox")
    .children("img")
    .attr("src", "/Style Library/MiningViolations/images/blueSideMenu.png");
  $(".SideMenu").addClass("blueMunu");
  $(".PreLoader").addClass("active");
  // $(".popupHeader").find(".printBtn").children("img").attr("src","/Style Library/MiningViolations/images/BluePrintBtn.png")

  if (functions.getPageName() === "QuarryForm") {
    functions.setPageMetaData("محضر ضبط محجر مخالف");
    quarryViolation.formActions();
  } else if (functions.getPageName() === "CarForm") {
    functions.setPageMetaData("محضر ضبط عربة مخالفة");
    carViolation.formActions();
  } else if (functions.getPageName() === "ViolationsLog") {
    functions.setPageMetaData("سجل المحاضر المسجلة");
    sharedApis.getViolationZones("#violationZone");
    sharedApis.getViolationType("#TypeofViolation");
    violationRecords.getViolations();
    // console.log(pagination.currentPage)
    $(".searchBtn").on("click", (e) => {
      e.preventDefault();
      violationRecords.filterViolationsLog(e);
    });
  } else if (functions.getPageName() === "DashBoard") {
    functions.setPageMetaData("الصفحة الرئيسية");
    $(".PreLoader").removeClass("active");
  }
} else if (functions.getSiteName() === "ViolationsBranch") {
  sharedApis.getUserDetails();
  $(".SideMenu")
    .find(".userBackImageBox")
    .children("img")
    .attr("src", "/Style Library/MiningViolations/images/greenSideMenu.png");
  $(".SideMenu").addClass("greenMunu");
  $(".PreLoader").addClass("active");
  // $(".popupHeader").find(".printBtn").children("img").attr("src","/Style Library/MiningViolations/images/GreenPrintBtn.png")

  if (functions.getPageName() === "PendingViolations") {
    functions.setPageMetaData("سجل المخالفات قيد الانتظار");
    sharedApis.getViolationZones("#violationZone");
    sharedApis.getViolationType("#TypeofViolation");
    PendingViolations.getPendingViolations();
    $(".searchBtn").on("click", (e) => {
      e.preventDefault();
      PendingViolations.filterViolationsLog(e);
    });
  } else if (functions.getPageName() === "ValidatedViolations") {
    functions.setPageMetaData("سجل المخالفات المصدق عليها");
    sharedApis.getViolationZones("#violationZone");
    sharedApis.getViolationType("#TypeofViolation");
    sharedApis.getPaymentStatus("#PaymentStatus");
    validatedViolations.getValidatedViolations();
    $(".searchBtn").on("click", (e) => {
      e.preventDefault();
      validatedViolations.filterViolationsLog(e);
    });
  } else if (functions.getPageName() === "RejectedViolations") {
    functions.setPageMetaData("سجل المخالفات المرفوضة");
    sharedApis.getViolationZones("#violationZone");
    sharedApis.getViolationType("#TypeofViolation");
    rejectedViolations.getRejectedViolations();
    $(".searchBtn").on("click", (e) => {
      e.preventDefault();
      rejectedViolations.filterViolationsLog(e);
    });
  } else if (functions.getPageName() === "RunningViolations") {
    functions.setPageMetaData("سجل المخالفات القائمة");
    sharedApis.getViolationZones("#violationZone");
    sharedApis.getViolationType("#TypeofViolation");
    runningViolations.getRunningViolations();
    $(".searchBtn").on("click", (e) => {
      e.preventDefault();
      runningViolations.filterViolationsLog(e);
    });
  } else if (functions.getPageName() === "CasesLog") {
    functions.setPageMetaData("سجل القضايا");
  } else if (functions.getPageName() === "DashBoard") {
    functions.setPageMetaData("الصفحة الرئيسية");
    $(".PreLoader").removeClass("active");
  }
} else if (functions.getSiteName() === "SectorManager") {
  sharedApis.getUserDetails();
  $(".SideMenu")
    .find(".userBackImageBox")
    .children("img")
    .attr("src", "/Style Library/MiningViolations/images/blueSideMenu.png");
  $(".SideMenu").addClass("blueMunu");
  $(".PreLoader").addClass("active");

  if (functions.getPageName() === "RunningTasks") {
    functions.setPageMetaData(" سجل المخالفات القائمة");
    sharedApis.getViolationZones("#violationZone");
    sharedApis.getViolationType("#TypeofViolation");
    runningSectorTask.getRunningTasks();
    $(".searchBtn").on("click", (e) => {
      e.preventDefault();
      runningSectorTask.filterTasksLog(e);
    });
  } else if (functions.getPageName() === "ConfirmedViolation") {
    functions.setPageMetaData(" سجل المخالفات المصدق عليها");
    sharedApis.getViolationZones("#violationZone");
    sharedApis.getViolationType("#TypeofViolation");
    confirmedViolationLog.getConfirmedLog();

    $(".searchBtn").on("click", (e) => {
      e.preventDefault();
      confirmedViolationLog.filterConfirmedLog(e);
    });
  }
}
