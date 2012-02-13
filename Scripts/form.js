// FormJS Namespace
var FormJS = new 
function () {
    // private methods and vars
    var Debug = function (sender, message) {
        if (FormJS.Verbose) {
            console.log([new Date().getTime(), " : ", "FormJS.", sender, " : ", message].join(""));
        }
    };

    var Error = function (sender, message) {
        console.error([new Date().getTime(), " : ", "FormJS.", sender, " : ", message].join(""));
    }

    // public methods and vars
    this.Initialized = false;
    this.Verbose = true;
    this.CurrentPage = 0;
    this.CurrentPageTitle = '';
    this.TotalPages = 0;
    this.MaxPages = 50;
    this.FormsDir = 'Forms';
    this.ReturnPage = 'file:///Users/neudesic/Documents/arjo/Index.html';
    this.ReturnPageTitle = 'Home';
    this.ReturnPageIcon = 'home';
    this.SelectPageTitle = 'Select Page';
    this.FormID = '';
    this.DefaultTransition = 'none';
    this.PageTitles = new Array();

    this.HeaderHTML = '<div data-role="header" data-position="inline"><a href="{FormJS.ReturnPage}" data-transition="{FormJS.DefaultTransition}" data-icon="{FormJS.ReturnPageIcon}">{FormJS.ReturnPageTitle}</a><h1>Page {FormJS.CurrentPage} - {FormJS.CurrentPageTitle}</h1></div>';

    this.FooterHTML = '<div data-role="footer" data-position="fixed" class="form-footer"><div class="ui-grid-b"><div class="ui-block-a"><button class="progressbar-previous" id="progressbar-previous-{FormJS.SelectPageIndex}" data-icon="arrow-l">Previous Page</button></div><div class="ui-block-b"><select name="progressbar-quickjump" class="progressbar-quickjump" id="progressbar-quickjump-{FormJS.SelectPageIndex}" data-inline="true"><option value="">{FormJS.SelectPageTitle}</option></select></div><div class="ui-block-c"><button class="progressbar-next" id="progressbar-next-{FormJS.SelectPageIndex}" data-icon="arrow-r" data-iconpos="right">Next Page</button></div></div></div>';

    this.SelectPageRootHTML = '<option value="none" selected="selected" >{FormJS.SelectPageTitle}</option>';
    this.SelectPageItemHTML = '<option value="{FormJS.SelectPageIndex}">Page {FormJS.SelectPageIndex} - {FormJS.SelectPageTitle}</option>';

    this.Initialize = function () {
        Debug('Initialize', 'Checking state');
        if (!FormJS.Initialized) {
            Debug('Initialize', 'Initialization started');

            //TODO: detect how many pages and cache first
            Debug('Initialize', 'Loading forms');
            var allFormsDiscovered = false;
            var pagePlaceholderContent;

            for (formIndex = 1; formIndex <= FormJS.MaxPages; formIndex++) {
                if (!allFormsDiscovered) {
                    $.ajax(
                    {
                        url: [FormJS.FormsDir, "/", formIndex, ".html"].join(""),
                        async: false,
                        success: function (html) {
                            Debug('Initialize', ["Loaded Page ", formIndex].join(""));
                            FormJS.TotalPages++;
                            // construct the page content
                            var pageStartDiv = ['<div data-role="page" id="forms-page', formIndex, '">'].join("");
                            var pageEndDiv = '</div>';
                            pagePlaceholderContent += [pageStartDiv, FormJS.HeaderHTML, html, FormJS.FooterHTML, pageEndDiv].join("");
                        },
                        error: function () {
                            Debug('Initialize', 'All potential form pages have been discovered.');
                            allFormsDiscovered = true;
                        }
                    }
                	);
                }
            }

            // Check that we have found some pages!
            if (FormJS.TotalPages == 0) {
                Error('Initialize', 'No forms were found.  Please label the forms 1.html, 2.html, etc. and place in folder');
                FormJS.Initialized = true;
                return;
            }

            // Load the forms into the DOM
            Debug('Initialize', 'Replacing forms placeholder with content');
            $('#forms-placeholder').replaceWith(pagePlaceholderContent);

            // Add form titles and bindings
            for (formIndex = 1; formIndex <= FormJS.TotalPages; formIndex++) {
                // Setup the header of the page
                var pageTitle = $(['#forms-page', formIndex].join("")).find('[data-title]').attr('data-title');
                Debug('Initialize', ['Setting Page ', formIndex, ' Title to ', pageTitle].join(""));

                var pageHeader = $(['#forms-page', formIndex].join("")).find('[data-role="header"]');
                var pageHeaderHTML = pageHeader.html();
                pageHeaderHTML = pageHeaderHTML.replace(/{FormJS.ReturnPageTitle}/g, FormJS.ReturnPageTitle);
                pageHeaderHTML = pageHeaderHTML.replace(/{FormJS.ReturnPageIcon}/g, FormJS.ReturnPageIcon);
                pageHeaderHTML = pageHeaderHTML.replace(/{FormJS.ReturnPage}/g, FormJS.ReturnPage);
                pageHeaderHTML = pageHeaderHTML.replace(/{FormJS.CurrentPage}/g, formIndex);
                pageHeaderHTML = pageHeaderHTML.replace(/{FormJS.CurrentPageTitle}/g, pageTitle);
                pageHeaderHTML = pageHeaderHTML.replace(/{FormJS.DefaultTransition}/g, FormJS.DefaultTransition);
                pageHeader.html(pageHeaderHTML);

                // Setup the footer of the page
                var pageFooter = $(['#forms-page', formIndex].join("")).find('[data-role="footer"]');
                var pageFooterHTML = pageFooter.html();
                pageFooterHTML = pageFooterHTML.replace(/{FormJS.SelectPageTitle}/g, FormJS.SelectPageTitle);
                pageFooterHTML = pageFooterHTML.replace(/{FormJS.SelectPageIndex}/g, formIndex);
                pageFooter.html(pageFooterHTML);

                // Push page title to stack
                FormJS.PageTitles.push(pageTitle);

                // Setup the form page bindings
                Debug('Initialize', ['Setting bindings for page ', formIndex].join(""));
                $(['#forms-page', formIndex].join("")).bind('pageshow', FormJS.PageShow);

                // Setup the bindings for the previous, next buttons, and select menu
                Debug('Initialize', 'Setting bindings for progress bar');
                $(['#progressbar-next-', formIndex].join("")).bind('click', FormJS.NextButton);
                $(['#progressbar-previous-', formIndex].join("")).bind('click', FormJS.PreviousButton);
                $(['#progressbar-quickjump-', formIndex].join("")).bind('change', FormJS.QuickJumpSelect);

            }

            // Init complete
            Debug('Initialize', 'Initialization complete');
            FormJS.Initialized = true;
        }
    };

    this.Show = function (memberId) {
        Debug('Show', 'FormJS Activated');
        loadData();
        if (FormJS.Initialized) {
            $.mobile.changePage("#forms-page1", {
                transition: FormJS.DefaultTransition
            });
        }
        else {
            Error('Show', 'FormJS has not been initialized.')
        }
    };

    this.Submit = function (indexes, data) {
        saveData();
        alert("You should override this function with your own.");
    }

    this.PageShow = function () {
        Debug('PageShow', this.id);

        Debug('PageShow', 'Setting current page');
        FormJS.CurrentPage = this.id.split('forms-page')[1];

        Debug('PageShow', 'Updating QuickJump Bar');
        var activeProgressBar = $('#' + this.id).find('.progressbar-quickjump');
        activeProgressBar.empty();
        var activeProgressBarTitle = FormJS.SelectPageRootHTML.replace('{FormJS.SelectPageTitle}', FormJS.SelectPageTitle);
        activeProgressBar.append(activeProgressBarTitle);
        $.each(FormJS.PageTitles,
        function (index, title) {
            var activeProgressBarItem = FormJS.SelectPageItemHTML;
            activeProgressBarItem = activeProgressBarItem.replace(/{FormJS.SelectPageIndex}/g, (index + 1));
            activeProgressBarItem = activeProgressBarItem.replace(/{FormJS.SelectPageTitle}/g, title);
            activeProgressBar.append(activeProgressBarItem);
        });

        Debug('PageShow', 'Resetting QuickJump bar select value');
        activeProgressBar.val(0);
        activeProgressBar.selectmenu('refresh');

        Debug('PageShow', 'Setting previous and next button titles correctly');
        var activePreviousButton = $('#' + this.id).find('.progressbar-previous');
        if (FormJS.CurrentPage == 1) {
            activePreviousButton.prev('span').find('span.ui-btn-text').text(['Back to ', FormJS.ReturnPageTitle].join(""));
        }
        else {
            activePreviousButton.prev('span').find('span.ui-btn-text').text('Previous Page');
        }

        var activeNextButton = $('#' + this.id).find('.progressbar-next');
        if (FormJS.CurrentPage == FormJS.TotalPages) {
            activeNextButton.prev('span').find('span.ui-btn-text').text('Submit');
        }
        else {
            activeNextButton.prev('span').find('span.ui-btn-text').text('Next Page');
        }
    };

    this.PageHide = function () {
        Debug('PageHide', this.id);
    };

    this.HomeButton = function () {
        alert("home button pressed");
    };

    this.NextButton = function () {
        Debug('NextButton', 'Clicked');
        saveData();


        if (FormJS.CurrentPage < FormJS.TotalPages) {
            FormJS.CurrentPage++;
            loadData();
            $.mobile.changePage(['#forms-page', FormJS.CurrentPage].join(""), {
                transition: FormJS.DefaultTransition
            });
        }
        else {
            Debug('NextButton', 'Already at last page - submitting now');
            FormJS.Submit();
        }
    };

    this.PreviousButton = function () {
        Debug('PreviousButton', 'Clicked');
        saveData();

        if (FormJS.CurrentPage > 1) {
            FormJS.CurrentPage--;
            loadData();

            $.mobile.changePage(['#forms-page', FormJS.CurrentPage].join(""), {
                transition: FormJS.DefaultTransition
            });
        }
        else {
            Debug('PreviousButton', 'Unable to change - already at first page');
        }
    };

    this.QuickJumpSelect = function (index) {
        Debug('QuickJumpSelect', 'Changed');
        var newPageIndex = $(index.target).val();
        Debug('QuickJumpSelect', newPageIndex);
        saveData();
        loadData();

        $.mobile.changePage(['#forms-page', newPageIndex].join(""), {
            transition: FormJS.DefaultTransition
        });
    };

};




// Initialization function to bring in all of the forms into the DOM
$('[data-role=page]').live('pageshow', FormJS.Initialize);

// Need to handle refresh on pages that no longer exist in the DOM
$(document).ready(function()
 {
    if (!FormJS.Initialized)
    {
        var indexPage = document.URL.split('#')[0];
        window.location.href = indexPage;
    }
});


/*function nativeDatePickerSupport() {
    if (navigator.userAgent.indexOf('iPad; CPU OS 5_') != -1) {
        return true;
    }
    else {
        return false;
    }
}*/

/*




$('.form-page').live('pagebeforehide', function (event, ui) {
    // hide the loading page dialog
    debug(".form-page pagebeforehide", "Hiding loading dialog");
    $.mobile.hidePageLoadingMsg();

    debug('.form-page', 'pagebeforehide');

    // look for each of the drop down data elements before losing the page
    $('#' + assessmentPages[currentPage - 2] + ' .data-dropdown').each(function (index, element) {
        saveLocalData(selectedMemberId, element.id, $(element).val());
        //selectedMemberData[element.id] = $(element).val();
        //console.log(element.id + ":" + $(element).val());

    });
    $('#' + assessmentPages[currentPage - 2] + ' .data-radiochoice').each(function (index, element) {
        // add data to the array
        //selectedMemberData[element.id] = $('#' + element + ':checked+label').text().trim();
        var rname = $("#" + element.id).attr("name");
        saveLocalData(selectedMemberId, element.id, $("input[name=" + rname + "]:checked+label").text().trim());
        //selectedMemberData[element.id] = $("input[name=" + rname + "]:checked+label").text().trim();
        //console.log(element.id + ":" + $("input[name=" + rname + "]:checked+label").text().trim());

    });
    $('#' + assessmentPages[currentPage - 2] + ' .data-input').each(function (index, element) {
        // add data to the array
        saveLocalData(selectedMemberId, element.id, $(element).val().trim());
        //selectedMemberData[element.id] = $(element).val().trim();
        //console.log(element.id + ":" + $(element).val());
    });
    $('#' + assessmentPages[currentPage - 2] + ' .data-dateinput').each(function (index, element) {
        // add data to the array
        saveLocalData(selectedMemberId, element.id, $(element).val().trim());
        //selectedMemberData[element.id] = $(element).val().trim();
        //console.log(element.id + ":" + $(element).val());
    });

    $('#' + assessmentPages[currentPage - 2] + ' .data-checkbox').each(function (index, element) {
        // add data to the array
        var rname = $("#" + element.id).attr("name");
        saveLocalData(selectedMemberId, element.id, $("input[name=" + rname + "]:checked+label").text().trim());
        //selectedMemberData[element.id] = $("input[name=" + rname + "]:checked+label").text().trim();
        //console.log(element.id + ":" + $(element).val());
    });

    $('#' + assessmentPages[currentPage - 2] + ' .data-listview > li').each(function (index) {

        if ($(this).find(".ui-block-c").length) {
            var listObject = new Object();
            listObject.pageName = assessmentPages[currentPage - 2];
            listObject.content1 = $(this).find(".ui-block-a").text().trim() + "/" + $(this).find(".ui-block-b").text().trim() + "/" + $(this).find(".ui-block-c").text().trim();
        } else {
            var listObject = new Object();
            listObject.pageName = assessmentPages[currentPage - 2];
            listObject.content1 = $(this).find(".ui-block-a").text().trim() + "/" + $(this).find(".ui-block-b").text().trim();
        }
        saveLocalData(selectedMemberId, assessmentPages[currentPage - 2] + " " + index, listObject);
        //selectedMemberData[assessmentPages[currentPage - 2] + " " + index] = listObject;

    });


    //    $('.data-dropdown').each(function (index, element) {




});

$('.form-page').live('pagehide', function (event, ui) {
    // hide the loading page dialog
    debug(".form-page pagehide", "Hiding loading dialog");
    $.mobile.hidePageLoadingMsg();

    $('.progressbar-quickjump').val(0); 
});


$('.form-page').live('pageshow', function (event, ui) {

    // hide the loading page dialog
    debug(".form-page pageshow", "Hiding loading dialog");
    $.mobile.hidePageLoadingMsg();

    debug('.form-page', 'pageshow');

    //alert($(this).find('[data-role="datebox"]').length);
    if (nativeDatePickerSupport()) {

        if ($(this).find('[data-role="datebox"]').length > 0) {
            //alert("vachanoch")
            $.each($(this).find('[data-role="datebox"]'), function (index) {

                var pickerid = this.id;
                $("#" + pickerid).parents(".ui-input-datebox").replaceWith("<input type='date' data-theme='b' id='" + pickerid + "'/>");
                $("#" + pickerid).textinput();
                //(".ui-input-datebox").replacewith("<div>test</div>")

            });
        }
    }


    // correctly repopulate the right fields based on the form data
    $('#' + assessmentPages[currentPage - 1] + ' .data-dropdown').each(function (index, element) {
        $(element).val(loadLocalData(selectedMemberId, element.id));
        $(element).selectmenu('refresh');
    });

    //loading radio buttons values
    //    $('#' + assessmentPages[currentPage - 1] + ' .data-radiochoice').each(function (index, element) {
    //        console.log("manaki kavalasindi ide" + element.id);
    //        var currentElement = loadLocalData(selectedMemberId, element.id);
    //        var rname = $("#" + element.id).attr("name");
    //        if (currentElement) {

    //            $('input[name=' + rname + ']:checked').val(currentElement).checkboxradio("refresh"); ;

    //        }
    //        else {

    //            $('input[name=' + rname + ']:checked').checked = false;
    //        }

    //    });
    //loading input values
    $('#' + assessmentPages[currentPage - 1] + ' .data-input').each(function (index, element) {
        // console.log("manaki kavalasindi ide" + element.id);
        var currentElement = loadLocalData(selectedMemberId, element.id);

        if (currentElement) {

            $("#" + element.id).val(currentElement);

        }
        else {

            $("#" + element.id).val(" ");
        }

    });
    //loading DATE values
    $('#' + assessmentPages[currentPage - 1] + ' .data-dateinput').each(function (index, element) {
        // console.log("manaki kavalasindi ide" + element.id);
        var currentElement = loadLocalData(selectedMemberId, element.id);
        if (currentElement) {

            $("#" + element.id).val(currentElement);

        }
        else {

            $("#" + element.id).val(" ");
        }

    });
    //loading checkbox values
    $('#' + assessmentPages[currentPage - 1] + ' .data-checkbox').each(function (index, element) {
        // add data to the array
        //selectedMemberData[element.id] = $('#' + element + ':checked+label').text().trim();
        var currentElement = loadLocalData(selectedMemberId, element.id);
        console.log("manaki kavalasindi ide" + currentElement);
        if (currentElement) {

            $("#" + element.id).attr("checked", true).checkboxradio("refresh");

        }
        else {

            $("#" + element.id).attr("checked", false).checkboxradio("refresh");
        }
    });




    // correctly set the previous button title
    if (currentPage == 1) {
        $('.progressbar-previousButton').prev('span').find('span.ui-btn-text').text('Back to Assessments');
    }
    else {
        $('.progressbar-previousButton').prev('span').find('span.ui-btn-text').text('Previous Page');
    }

    // correctly set the next button title
    if (currentPage == assessmentPages.length) {
        $('.progressbar-nextButton').prev('span').find('span.ui-btn-text').text('Submit');
    }
    else {
        $('.progressbar-nextButton').prev('span').find('span.ui-btn-text').text('Next Page');
    }
});


    // if user clicks on next button on last page
    if (currentPage == assessmentPages.length + 1) {
        if (navigator.onLine == true) {

            var submitData = { "MemberId": selectedMemberId, "Indexes": localDataIndexes(selectedMemberId), "Data": localDataStorage(selectedMemberId) };
            var submitDataJson = JSON.stringify(submitData);

            $.ajax({
                type: "POST",
                url: [controllerRoot, "/Assessment/Add"].join(""),
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                data: submitDataJson,
                success: function (data) {
                    alert(data);
                }
            });
        }
        else {
            alert("You are not connected to the server at this time.  All of your assessment data has been saved, but you cannot submit until you are online.");
        }

        // hide the loading page dialog
        debug(".progressbar nextButton", "Hiding loading dialog");
        $.mobile.hidePageLoadingMsg();
    }
});

*/
