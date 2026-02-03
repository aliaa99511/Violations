// import $ from "jquery";
// import $ from './Libraries/jquery'
//var dt = require("datatables.net")(window, $);
// import Swal from 'sweetalert2';
import bootpopup from "./Libraries/bootpopup";
import functions from "./Shared/functions";
import sharedApis from "./Shared/sharedApiCall";

// Modules ----------------------------------------------------------------
import home from "./Modules/Home";
import quarryViolation from "./Modules/ViolationsRecorder/quarryViolationForm";
import equipmentViolation from "./Modules/ViolationsRecorder/equipmentViolationForm";
import carViolation from "./Modules/ViolationsRecorder/carViolations";
import violationRecords from "./Modules/ViolationsRecorder/registeredViolationsRecords";
import approvedViolationsRecords from "./Modules/ViolationsRecorder/approvedViolationsRecords";
import rejectedViolationsRecords from "./Modules/ViolationsRecorder/rejectedViolationsRecords";
import validatedViolationsRecords from "./Modules/ViolationsRecorder/validatedViolationsRecords";
import PendingViolations from "./Modules/ViolationsBranch/PendingViolations";
import runningViolations from "./Modules/ViolationsBranch/RunningViolations";
import validatedViolations from "./Modules/ViolationsBranch/ValidatedViolations";
import completedViolations from "./Modules/ViolationsBranch/completedViolations";
import rejectedViolations from "./Modules/ViolationsBranch/RejectedViolations";
import violationsCases from "./Modules/ViolationsBranch/ViolationsCases";
import runningSectorTask from "./Modules/SectorManager/RunningTasks";
import confirmedViolationLog from "./Modules/SectorManager/ConfirmedViolationLog";
import certificationCases from "./Modules/SectorManager/CertificationViolationsCases";
import prevViolations from "./Shared/prevViolations";
import petitionsLog from "./Shared/petitionslog";
import pagination from "./Shared/Pagination";
import sideMenuFunctions from "./Modules/sideMenu";
import externalViolationForm from "./Modules/ViolationsBranch/ExternalViolationForm";

$(".PreLoader").addClass("active");
$(window).on("load", () => {
  if (document.readyState == "complete") {
    sideMenuFunctions.getOnlyVisibleNavSubsites().then((Navigation) => {
      // Render the navigation menu
      sideMenuFunctions.renderNavigationMenu(Navigation);
    });

    if (functions.getSiteName() === "Home") {
      $(".PreLoader").find("span").addClass("greenLoader");
      // $(".PreLoader").addClass("active");
      $("#s4-workspace").addClass("greenScroller");
      home.redirectUser();
    }
    if (functions.getSiteName() === "ViolationsRecorder") {
      sharedApis.getUserDetails();
      $(".SideMenu")
        .find(".userBackImageBox")
        .children("img")
        .attr("src", "/Style Library/MiningViolations/images/blueSideMenu.png");
      $(".SideMenu").addClass("blueMunu");
      $(".header").addClass("blueHeader");
      $(".header")
        .find(".userDetailsImg")
        .children("img")
        .attr("src", "/Style Library/MiningViolations/images/userIconBlue.png");
      $(".PreLoader").find("span").addClass("blueLoader");
      // $(".PreLoader").addClass("active");
      $("#s4-workspace").addClass("blueScroller");
      // $(".popupHeader").find(".printBtn").children("img").attr("src","/Style Library/MiningViolations/images/BluePrintBtn.png")

      if (functions.getPageName() === "QuarryForm") {
        functions.setPageMetaData("محضر ضبط محجر مخالف");
        quarryViolation.formActions();
        quarryViolation.editViolation();
      }
      if (functions.getPageName() === "CarForm") {
        functions.setPageMetaData("محضر ضبط عربة مخالفة");
        carViolation.formActions();
        carViolation.editViolation();
      }
      if (functions.getPageName() === "EquipmentForm") {
        functions.setPageMetaData("محضر ضبط معدة مخالفة");
        equipmentViolation.formActions();
        equipmentViolation.editViolation();
      }
      if (functions.getPageName() === "prevViolationsQueryLog") {
        $(".PreLoader").removeClass("active");
        functions.setPageMetaData("الاستعلام عن المخالفات السابقة");
        prevViolations.dashBoardTable();
        $(".filterBox")
          .find("#violatorNationalId")
          .on("keypress", (e) => {
            return functions.isNumberKey(e);
          });
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          prevViolations.filterViolationsLog(e);
        });
      }
      if (functions.getPageName() === "PendingViolationsRecordsLog") {
        functions.setPageMetaData("سجل المحاضر المسجلة");
        sharedApis.getOffenderType("#violationCategory");
        sharedApis.getViolationType("#TypeofViolation");
        sharedApis.getViolationSectors("#violationSector");
        // Initialize datepickers for date inputs
        functions.inputDateFormat("#createdFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#createdTo", "", "", "dd-mm-yyyy");

        violationRecords.getViolations();
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          violationRecords.filterViolationsLog(e);
        });
        $(".resetBtn").on("click", (e) => {
          violationRecords.resetFilter(e);
        });
      }
      if (functions.getPageName() === "ApprovedViolationsRecordsLog") {
        functions.setPageMetaData("سجل المحاضر الموافق عليها");
        sharedApis.getOffenderType("#violationCategory");
        sharedApis.getViolationType("#TypeofViolation");
        approvedViolationsRecords.getViolations();
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          approvedViolationsRecords.filterViolationsLog(e);
        });
      }
      if (functions.getPageName() === "ValidatedViolationsRecordsLog") {
        functions.setPageMetaData("سجل المحاضر المصدق عليها");
        sharedApis.getOffenderType("#violationCategory");
        sharedApis.getViolationType("#TypeofViolation");
        sharedApis.getViolationSectors("#violationSector");

        // sharedApis.getPaymentStatus("#PaymentStatus");
        sharedApis.getViolationStatus("#ViolationStatus");

        // Initialize datepickers for date inputs
        functions.inputDateFormat("#createdFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#createdTo", "", "", "dd-mm-yyyy");

        validatedViolationsRecords.getViolations();
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          validatedViolationsRecords.filterViolationsLog(e);
        });
        $(".resetBtn").on("click", (e) => {
          validatedViolationsRecords.resetFilter(e);
        });
      }
      if (functions.getPageName() === "RejectedViolationsRecordsLog") {
        functions.setPageMetaData("سجل المحاضر المرفوضة");
        sharedApis.getOffenderType("#violationCategory");
        sharedApis.getViolationType("#TypeofViolation");
        rejectedViolationsRecords.getViolations();
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          rejectedViolationsRecords.filterViolationsLog(e);
        });
      }
      if (functions.getPageName() === "DashBoard") {
        functions.setPageMetaData("الصفحة الرئيسية");
        $(".PreLoader").removeClass("active");
      }
    }
    if (functions.getSiteName() === "ViolationsBranch") {
      sharedApis.getUserDetails();
      $(".SideMenu")
        .find(".userBackImageBox")
        .children("img")
        .attr(
          "src",
          "/Style Library/MiningViolations/images/greenSideMenu.png",
        );
      $(".SideMenu").addClass("greenMunu");
      $(".header").addClass("greenHeader");
      $(".header")
        .find(".userDetailsImg")
        .children("img")
        .attr(
          "src",
          "/Style Library/MiningViolations/images/userIconGreen.png",
        );
      $(".PreLoader").find("span").addClass("greenLoader");
      // $(".PreLoader").addClass("active");
      $("#s4-workspace").addClass("greenScroller");
      // $(".popupHeader").find(".printBtn").children("img").attr("src","/Style Library/MiningViolations/images/GreenPrintBtn.png")

      if (functions.getPageName() === "PendingViolations") {
        functions.setPageMetaData("سجل المخالفات قيد الانتظار");
        // sharedApis.getViolationZones("#violationZone");
        sharedApis.getViolationSectors("#violationSector");
        sharedApis.getOffenderType("#violationCategory");
        sharedApis.getViolationType("#TypeofViolation");

        // Initialize datepickers for date inputs
        functions.inputDateFormat("#createdFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#createdTo", "", "", "dd-mm-yyyy");

        PendingViolations.getPendingViolations();
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          PendingViolations.filterViolationsLog(e);
        });
        $(".resetBtn").on("click", (e) => {
          PendingViolations.resetFilter(e);
        });
      }
      if (functions.getPageName() === "ValidatedViolations") {
        functions.setPageMetaData("سجل المخالفات المصدق عليها");
        // sharedApis.getViolationZones("#violationZone");
        sharedApis.getViolationSectors("#violationSector");
        sharedApis.getViolationType("#TypeofViolation");
        sharedApis.getOffenderType("#violationCategory");
        // sharedApis.getPaymentStatus("#PaymentStatus");
        sharedApis.getViolationStatus("#ViolationStatus");

        // Initialize datepickers for date inputs
        functions.inputDateFormat("#createdFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#createdTo", "", "", "dd-mm-yyyy");

        validatedViolations.getValidatedViolations();
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          validatedViolations.filterViolationsLog(e);
        });
        $(".resetBtn").on("click", (e) => {
          validatedViolations.resetFilter(e);
        });
      }
      if (functions.getPageName() === "RejectedViolations") {
        functions.setPageMetaData("سجل المخالفات المرفوضة");
        // sharedApis.getViolationZones("#violationZone");
        sharedApis.getViolationSectors("#violationSector");
        sharedApis.getViolationType("#TypeofViolation");
        rejectedViolations.getRejectedViolations();
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          rejectedViolations.filterViolationsLog(e);
        });
      }
      if (functions.getPageName() === "RunningViolations") {
        functions.setPageMetaData("سجل المخالفات القائمة");
        // sharedApis.getViolationZones("#violationZone");
        sharedApis.getViolationSectors("#violationSector");
        sharedApis.getOffenderType("#violationCategory");
        sharedApis.getViolationType("#TypeofViolation");

        // Initialize datepickers for date inputs
        functions.inputDateFormat("#createdFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#createdTo", "", "", "dd-mm-yyyy");

        runningViolations.getRunningViolations();
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          runningViolations.filterViolationsLog(e);
        });
        $(".resetBtn").on("click", (e) => {
          runningViolations.resetFilter(e);
        });
      }
      if (functions.getPageName() === "prevViolationsQueryLog") {
        $(".PreLoader").removeClass("active");
        functions.setPageMetaData("الاستعلام عن المخالفات السابقة");
        prevViolations.dashBoardTable();
        $(".filterBox")
          .find("#violatorNationalId")
          .on("keypress", (e) => {
            return functions.isNumberKey(e);
          });
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          prevViolations.filterViolationsLog(e);
        });
      }
      if (functions.getPageName() === "CasesLog") {
        functions.setPageMetaData("سجل القضايا");
        violationsCases.getViolationsCases();
        sharedApis.getCasesStatus("#CaseStatus");
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          violationsCases.filterViolationsLog(e);
        });
      }
      if (functions.getPageName() === "PendingPetitionsLog") {
        $(".PreLoader").find("span").addClass("greenLoader");
        $(".PreLoader").addClass("active");
        functions.setPageMetaData("سجل الإلتماسات قيد الإنتظار");
        // sharedApis.getViolationSectors("#violationSector")
        // sharedApis.getViolationType("#TypeofViolation");
        sharedApis.getOffenderType("#violationCategory");
        sharedApis.getPetitionsStatus("#petitionStatus");
        // Initialize datepickers for date inputs
        functions.inputDateFormat("#createdFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#createdTo", "", "", "dd-mm-yyyy");
        petitionsLog.getPetitions("التماس قيد الإنتظار");
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          petitionsLog.filterPetitionsLog(e);
        });
        $(".resetBtn").on("click", (e) => {
          petitionsLog.resetFilter(e);
        });
      }
      if (functions.getPageName() === "PetitionsLog") {
        $(".PreLoader").find("span").addClass("greenLoader");
        $(".PreLoader").addClass("active");
        functions.setPageMetaData("سجل الالتماسات");
        // sharedApis.getViolationSectors("#violationSector")
        // sharedApis.getViolationType("#TypeofViolation");
        sharedApis.getOffenderType("#violationCategory");
        sharedApis.getPetitionsStatus("#petitionStatus");
        // Initialize datepickers for date inputs
        functions.inputDateFormat("#createdFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#createdTo", "", "", "dd-mm-yyyy");
        petitionsLog.getPetitions();
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          petitionsLog.filterPetitionsLog(e);
        });
        $(".resetBtn").on("click", (e) => {
          petitionsLog.resetFilter(e);
        });
      }
      if (functions.getPageName() === "ExternalViolationForm") {
        functions.setPageMetaData("إنشاء مخالفات ضبط خارجية");
        externalViolationForm.formActions();
        externalViolationForm.violatorDetails();
      }
      // if (functions.getPageName() === "ExternalReviewedLog") {
      //   $(".PreLoader").removeClass("active");
      //   functions.setPageMetaData("سجل مخالفات ضبط خارجية");
      //   externalReviewed.getExternalReviewedViolations();
      //   $(".filterBox")
      //     .find("#violatorNationalId")
      //     .on("keypress", (e) => {
      //       return functions.isNumberKey(e);
      //     });
      //   $(".searchBtn").on("click", (e) => {
      //     e.preventDefault();
      //     pagination.reset();
      //     // externalReviewed.filterExternalReviewedViolations(e);
      //   });
      // }
      if (functions.getPageName() === "DashBoard") {
        functions.setPageMetaData("الصفحة الرئيسية");
        $(".PreLoader").removeClass("active");
      }
    }
    if (functions.getSiteName() === "CertificationOfficer") {
      sharedApis.getUserDetails();
      $(".SideMenu")
        .find(".userBackImageBox")
        .children("img")
        .attr(
          "src",
          "/Style Library/MiningViolations/images/greenSideMenu.png",
        );
      $(".SideMenu").addClass("greenMunu");
      $(".header").addClass("greenHeader");
      $(".header")
        .find(".userDetailsImg")
        .children("img")
        .attr(
          "src",
          "/Style Library/MiningViolations/images/userIconGreen.png",
        );
      $(".PreLoader").find("span").addClass("greenLoader");
      // $(".PreLoader").addClass("active");
      $("#s4-workspace").addClass("greenScroller");

      if (functions.getPageName() === "RunningTasks") {
        functions.setPageMetaData(" سجل المخالفات القائمة");
        // sharedApis.getViolationZones("#violationZone");
        sharedApis.getViolationSectors("#violationSector");
        sharedApis.getViolationType("#TypeofViolation");
        runningSectorTask.getRunningTasks();
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          runningSectorTask.filterTasksLog(e);
        });
      }
      if (functions.getPageName() === "ConfirmedViolation") {
        functions.setPageMetaData(" سجل المخالفات المصدق عليها");
        // sharedApis.getViolationZones("#violationZone");
        sharedApis.getViolationSectors("#violationSector");
        sharedApis.getViolationType("#TypeofViolation");
        sharedApis.getOffenderType("#violationCategory");

        // Initialize datepickers for date inputs
        functions.inputDateFormat("#createdFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#createdTo", "", "", "dd-mm-yyyy");

        confirmedViolationLog.getConfirmedLog();
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          confirmedViolationLog.filterConfirmedLog(e);
        });
        $(".resetBtn").on("click", (e) => {
          confirmedViolationLog.resetFilter(e);
        });
      }
      if (functions.getPageName() === "CertificationCasesLog") {
        functions.setPageMetaData("سجل القضايا");
        certificationCases.getViolationsCases();
        sharedApis.getCasesStatus("#CaseStatus");
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          certificationCases.filterViolationsLog(e);
        });
      }
      if (functions.getPageName() === "PetitionsLog") {
        $(".PreLoader").find("span").addClass("greenLoader");
        $(".PreLoader").addClass("active");
        functions.setPageMetaData("سجل الالتماسات");
        // sharedApis.getViolationSectors("#violationSector")
        // sharedApis.getViolationType("#TypeofViolation");
        sharedApis.getOffenderType("#violationCategory");
        sharedApis.getPetitionsStatus("#petitionStatus");
        // Initialize datepickers for date inputs
        functions.inputDateFormat("#createdFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#createdTo", "", "", "dd-mm-yyyy");
        petitionsLog.getPetitions();
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          petitionsLog.filterPetitionsLog(e);
        });
      }
    }
  }
});
