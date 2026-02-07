/*
 *  (C) Copyright 2026 TheOtherP (theotherp@posteo.net)
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

angular
    .module('nzbhydraApp')
    .factory('GuidedTourService', GuidedTourService);

function GuidedTourService($http, $timeout, $q, $rootScope, $sce, $state, uiTourService, ConfigService, CategoriesService, growl) {

    var service = {
        startTour: startTour,
        endTour: endTour,
        isTourActive: isTourActive,
        registerResultsSteps: registerResultsSteps,
        registerSearchSteps: registerSearchSteps
    };

    var tourActive = false;
    var fakeDownloaderInjected = false;
    var tour = null;
    var registeredStepIds = {};

    return service;


    // ─── Tour Lifecycle ────────────────────────────────────────────

    function startTour() {
        return $http.put('internalapi/demomode').then(function () {
            tourActive = true;
            registeredStepIds = {};
            injectFakeDownloader();

            tour = uiTourService.getTour();
            if (!tour) {
                console.error('GuidedTourService: No tour found. Make sure ui-tour directive exists.');
                endTour();
                return;
            }

            return tour.start();
        }, function (err) {
            growl.error('Could not activate demo mode. Tour cannot start.');
            console.error('Failed to activate demo mode', err);
        });
    }

    function endTour() {
        tourActive = false;
        return $http.delete('internalapi/demomode').then(function () {
            removeFakeDownloader();
            $rootScope.$broadcast('tourEnded');
        }, function () {
            // Even if deactivation fails, clean up the frontend
            removeFakeDownloader();
            $rootScope.$broadcast('tourEnded');
        });
    }

    function isTourActive() {
        return tourActive;
    }


    // ─── Fake Downloader ───────────────────────────────────────────

    function injectFakeDownloader() {
        var config = ConfigService.getSafe();
        if (!config.downloading) {
            config.downloading = {};
        }
        if (!config.downloading.downloaders) {
            config.downloading.downloaders = [];
        }
        var enabledDownloaders = _.filter(config.downloading.downloaders, 'enabled');
        if (enabledDownloaders.length === 0) {
            config.downloading.downloaders.push({
                name: 'Demo Downloader',
                enabled: true,
                downloaderType: 'SABNZBD',
                url: 'http://demo',
                apiKey: 'demo',
                defaultCategory: 'Default',
                iconCssClass: '',
                downloadType: 'NZB'
            });
            fakeDownloaderInjected = true;
        }
    }

    function removeFakeDownloader() {
        if (fakeDownloaderInjected) {
            var config = ConfigService.getSafe();
            if (config.downloading && config.downloading.downloaders) {
                config.downloading.downloaders = _.filter(config.downloading.downloaders, function (d) {
                    return d.name !== 'Demo Downloader';
                });
            }
            fakeDownloaderInjected = false;
        }
    }


    // ─── Automated Action Helpers ──────────────────────────────────

    function typeIntoField(selector, text, delayPerChar) {
        var deferred = $q.defer();
        var el = angular.element(document.querySelector(selector));
        if (el.length === 0) {
            console.warn('GuidedTourService: Element not found for typing: ' + selector);
            deferred.resolve();
            return deferred.promise;
        }

        var scope = el.scope();
        var ngModelCtrl = el.controller('ngModel');
        var charIndex = 0;
        delayPerChar = delayPerChar || 50;

        function typeNext() {
            if (charIndex < text.length) {
                var current = (ngModelCtrl ? ngModelCtrl.$viewValue : el.val()) || '';
                var next = current + text.charAt(charIndex);
                if (ngModelCtrl) {
                    ngModelCtrl.$setViewValue(next);
                    ngModelCtrl.$render();
                } else {
                    el.val(next);
                }
                charIndex++;
                $timeout(typeNext, delayPerChar);
            } else {
                // Trigger digest so Angular bindings update
                if (scope) {
                    scope.$apply();
                }
                deferred.resolve();
            }
        }

        // Clear the field first
        if (ngModelCtrl) {
            ngModelCtrl.$setViewValue('');
            ngModelCtrl.$render();
        } else {
            el.val('');
        }

        $timeout(typeNext, delayPerChar);
        return deferred.promise;
    }

    function clickElement(selector) {
        var deferred = $q.defer();
        $timeout(function () {
            var el = angular.element(document.querySelector(selector));
            if (el.length > 0) {
                el.triggerHandler('click');
            } else {
                console.warn('GuidedTourService: Element not found for click: ' + selector);
            }
            deferred.resolve();
        }, 100);
        return deferred.promise;
    }

    function waitForElement(selector, timeoutMs) {
        var deferred = $q.defer();
        var elapsed = 0;
        var interval = 100;
        timeoutMs = timeoutMs || 10000;

        function check() {
            var el = document.querySelector(selector);
            if (el) {
                deferred.resolve(el);
            } else if (elapsed >= timeoutMs) {
                console.warn('GuidedTourService: Timed out waiting for element: ' + selector);
                deferred.resolve(null);
            } else {
                elapsed += interval;
                $timeout(check, interval);
            }
        }

        check();
        return deferred.promise;
    }

    function selectCategory(categoryName) {
        var deferred = $q.defer();
        // Find the category in the dropdown and click it
        var categoryLinks = document.querySelectorAll('.search-category-option');
        var found = false;
        angular.forEach(categoryLinks, function (link) {
            if (angular.element(link).text().trim() === categoryName) {
                angular.element(link).triggerHandler('click');
                found = true;
            }
        });
        if (!found) {
            console.warn('GuidedTourService: Category not found: ' + categoryName);
        }
        $timeout(function () {
            deferred.resolve();
        }, 300);
        return deferred.promise;
    }

    function waitForResults() {
        // Wait for the search results view to load (the results table appears)
        return waitForElement('.search-results-table', 15000);
    }

    function selectFirstCheckbox() {
        var deferred = $q.defer();
        $timeout(function () {
            var checkboxes = document.querySelectorAll('.result-checkbox');
            if (checkboxes.length > 0) {
                angular.element(checkboxes[0]).triggerHandler('click');
            }
            deferred.resolve();
        }, 200);
        return deferred.promise;
    }


    // ─── Tour Step Definitions ─────────────────────────────────────

    /**
     * Creates a step only if it hasn't been registered yet.
     * Prevents duplicate steps when controllers re-initialize during cross-view navigation.
     */
    function createStepIfNew(config) {
        if (registeredStepIds[config.stepId]) {
            return;
        }
        tour.createStep(config);
        registeredStepIds[config.stepId] = true;
    }

    function registerResultsSteps() {
        if (!tour) {
            return;
        }

        // Phase 2: Browsing Results (steps 8-13)
        createStepIfNew({
            stepId: 'resultsTable',
            selector: '.search-results-table',
            order: 80,
            title: 'Search Results',
            content: $sce.trustAsHtml(
                'Here are your search results! Each row shows a result with its <strong>title</strong>, ' +
                'which <strong>indexer</strong> found it, the <strong>category</strong>, <strong>size</strong>, ' +
                'number of <strong>grabs</strong> (downloads), and <strong>age</strong>. ' +
                'The links column has download and info icons.'
            ),
            placement: 'top',
            scrollIntoView: true
        });

        createStepIfNew({
            stepId: 'sortByAge',
            selector: 'column-sortable[column="epoch"]',
            order: 90,
            title: 'Sorting Results',
            content: $sce.trustAsHtml(
                'You can sort results by clicking any column header. ' +
                'Click once for ascending, again for descending, and a third time to reset.'
            ),
            placement: 'top'
        });

        createStepIfNew({
            stepId: 'trySortByAge',
            selector: 'column-sortable[column="epoch"]',
            order: 100,
            title: 'Give It a Try!',
            content: $sce.trustAsHtml(
                'Go ahead and <strong>click the "Age" column header</strong> to sort by age. ' +
                'Then click "Next" to continue.'
            ),
            placement: 'top'
        });

        createStepIfNew({
            stepId: 'titleFilter',
            selector: '#title-filter',
            order: 110,
            title: 'Filtering by Title',
            content: $sce.trustAsHtml(
                'Type here to filter results by title in real time. ' +
                'Prefix a word with <code>!</code> to exclude it, or wrap your query in <code>/slashes/</code> to use a regex.'
            ),
            placement: 'bottom'
        });

        createStepIfNew({
            stepId: 'tryFilter',
            selector: '#title-filter',
            order: 120,
            title: 'Try Filtering',
            content: $sce.trustAsHtml(
                'Try typing a word to filter the results. ' +
                'When you\'re done experimenting, click "Next" to continue.'
            ),
            placement: 'bottom'
        });

        createStepIfNew({
            stepId: 'quickFilterButtons',
            selector: '.filter-button',
            order: 130,
            title: 'Quick Filter Buttons',
            content: $sce.trustAsHtml(
                'These buttons let you quickly filter by video source (HDTV, Blu-Ray, WEB, etc.) or quality (720p, 1080p, 2160p). ' +
                'Click one to toggle it on or off.'
            ),
            placement: 'bottom'
        });

        // Phase 3: Downloading Single Results (steps 14-16)
        createStepIfNew({
            stepId: 'downloadIcon',
            selector: '.result-send-to-downloader-link',
            order: 140,
            title: 'Download a Single Result',
            content: $sce.trustAsHtml(
                'Click one of these icons to send a result to your downloader (like SABnzbd or NZBGet). ' +
                'The icon will spin while sending, then show a checkmark on success.'
            ),
            placement: 'left',
            onNext: function () {
                // Auto-click the first download icon
                var icons = document.querySelectorAll('.result-send-to-downloader-link');
                if (icons.length > 0) {
                    angular.element(icons[0]).triggerHandler('click');
                }
                return $timeout(angular.noop, 1500); // Wait for the download animation
            }
        });

        createStepIfNew({
            stepId: 'downloadSuccess',
            selector: '.result-send-to-downloader-link',
            order: 150,
            title: 'Download Sent!',
            content: $sce.trustAsHtml(
                'The icon changed to show the download was successful. In real use, the NZB would now be in your download client.'
            ),
            placement: 'left'
        });

        createStepIfNew({
            stepId: 'directDownload',
            selector: '.result-nzb-download-link',
            order: 160,
            title: 'Direct NZB Download',
            content: $sce.trustAsHtml(
                'You can also download the NZB file directly to your computer by clicking this save icon.'
            ),
            placement: 'left'
        });

        // Phase 4: Multi-Select & Bulk Download (steps 17-23)
        createStepIfNew({
            stepId: 'resultCheckbox',
            selector: '.result-checkbox',
            order: 170,
            title: 'Selecting Results',
            content: $sce.trustAsHtml(
                'Use these checkboxes to select multiple results for bulk actions.'
            ),
            placement: 'right'
        });

        createStepIfNew({
            stepId: 'clickCheckbox',
            selector: '.result-checkbox',
            order: 180,
            title: 'Try It!',
            content: $sce.trustAsHtml(
                '<strong>Click this checkbox</strong> to select the first result. Then click "Next".'
            ),
            placement: 'right'
        });

        createStepIfNew({
            stepId: 'shiftClickExplain',
            selector: '.result-checkbox',
            order: 190,
            title: 'Shift+Click for Range',
            content: $sce.trustAsHtml(
                'Hold <strong>Shift</strong> and click another checkbox to select all results between your two clicks. ' +
                'This is great for grabbing a batch of results quickly.'
            ),
            placement: 'right'
        });

        createStepIfNew({
            stepId: 'tryShiftClick',
            selector: '.result-checkbox',
            order: 200,
            title: 'Try Shift+Click',
            content: $sce.trustAsHtml(
                'Try <strong>Shift+clicking</strong> another checkbox further down the list. ' +
                'Then click "Next" when you\'re ready.'
            ),
            placement: 'right'
        });

        createStepIfNew({
            stepId: 'selectionButton',
            selector: '#search-results-selection-button',
            order: 210,
            title: 'Selection Tools',
            content: $sce.trustAsHtml(
                'Use this button to <strong>invert</strong> your selection, <strong>select all</strong>, or <strong>deselect all</strong> results at once.'
            ),
            placement: 'bottom'
        });

        createStepIfNew({
            stepId: 'bulkDownload',
            selector: 'download-nzbs-button',
            order: 220,
            title: 'Bulk Download',
            content: $sce.trustAsHtml(
                'Once you\'ve selected some results, click here to send them all to your downloader at once. ' +
                'Let\'s try it!'
            ),
            placement: 'bottom',
            onNext: function () {
                // Auto-click the bulk download button
                var btn = document.querySelector('#send-selected-to-downloader') || document.querySelector('#send-selected-to-downloader-dropdown');
                if (btn) {
                    angular.element(btn).triggerHandler('click');
                }
                return $timeout(angular.noop, 1500);
            }
        });

        createStepIfNew({
            stepId: 'bulkDownloadDone',
            selector: 'download-nzbs-button',
            order: 230,
            title: 'Bulk Download Done!',
            content: $sce.trustAsHtml(
                'All selected results have been sent to the downloader. In a real scenario, your download client would start processing them right away.'
            ),
            placement: 'bottom',
            onNext: function () {
                // Navigate back to search page for Phase 5 (movie search)
                $state.go('root.search', {}, {inherit: false, notify: true, reload: true});
                return tour.waitFor('movieSearchIntro');
            }
        });

        // Phase 6: Display Options (steps 31-34)
        createStepIfNew({
            stepId: 'displayOptions',
            selector: '#display-options',
            order: 310,
            title: 'Display Options',
            content: $sce.trustAsHtml(
                'This dropdown lets you customize how results are displayed. You can toggle things like ' +
                '<strong>duplicate grouping</strong>, <strong>movie covers</strong>, <strong>episode grouping</strong>, and more.'
            ),
            placement: 'bottom'
        });

        createStepIfNew({
            stepId: 'displayOptionsOpen',
            selector: '#display-options',
            order: 320,
            title: 'Opening Display Options',
            content: $sce.trustAsHtml(
                'The dropdown is now open. Each option changes how results appear in the table below.'
            ),
            placement: 'bottom',
            onShow: function () {
                // Open the display options dropdown
                var btn = document.querySelector('#display-options .btn');
                if (btn) {
                    angular.element(btn).triggerHandler('click');
                }
                return $timeout(angular.noop, 300);
            }
        });

        createStepIfNew({
            stepId: 'displayOptionsHighlight',
            selector: '#display-options',
            order: 330,
            title: 'Key Options',
            content: $sce.trustAsHtml(
                '<strong>Show duplicate display triggers</strong> reveals which results are duplicates across indexers.<br>' +
                '<strong>Show movie covers</strong> displays poster images in movie results.<br>' +
                '<strong>Group TV results</strong> bundles episodes together for cleaner browsing.'
            ),
            placement: 'bottom'
        });

        createStepIfNew({
            stepId: 'tryDisplayOptions',
            selector: '#display-options',
            order: 340,
            title: 'Try Toggling',
            content: $sce.trustAsHtml(
                'Try toggling an option to see how it changes the results display. ' +
                'Click "Next" when you\'re done.'
            ),
            placement: 'bottom',
            onNext: function () {
                // Close the dropdown if open
                var dropdown = document.querySelector('#display-options .dropdown-menu');
                if (dropdown && dropdown.classList.contains('show')) {
                    var btn = document.querySelector('#display-options .btn');
                    if (btn) {
                        angular.element(btn).triggerHandler('click');
                    }
                }
                return $timeout(angular.noop, 200);
            }
        });

        // Phase 7: Wrap-Up (step 35)
        createStepIfNew({
            stepId: 'wrapUp',
            selector: '#display-options',
            order: 350,
            title: 'That\'s the Tour!',
            content: $sce.trustAsHtml(
                'You now know how to:<br>' +
                '&bull; Search using different categories and autocomplete<br>' +
                '&bull; Sort, filter, and browse results<br>' +
                '&bull; Download single results or in bulk<br>' +
                '&bull; Customize the display to your liking<br><br>' +
                'You can restart this tour anytime using the <strong>"Take a Tour"</strong> button on the search page. Enjoy using NZBHydra2!'
            ),
            placement: 'bottom',
            orphan: true
        });
    }


    // ─── Search Page Steps (Phase 1 + Phase 5) ────────────────────
    // These are registered from SearchController when the tour directive initializes

    function registerSearchSteps(tourInstance) {
        tour = tourInstance;

        // Phase 1: Basic Search (steps 1-7)
        createStepIfNew({
            stepId: 'welcome',
            selector: '#searchfield',
            order: 10,
            title: 'Welcome to the Tour!',
            content: $sce.trustAsHtml(
                'This tour will walk you through searching and browsing results in NZBHydra2. ' +
                'We\'ll cover searching, filtering, sorting, downloading, and customizing your experience.<br><br>' +
                'Click "Next" to get started!'
            ),
            placement: 'bottom',
            orphan: true,
            backdrop: true
        });

        createStepIfNew({
            stepId: 'categoryDropdown',
            selector: '#searchCategoryDropdownButton',
            order: 20,
            title: 'Categories',
            content: $sce.trustAsHtml(
                'This dropdown lets you pick a search category. Categories control what type of content is searched ' +
                '(e.g., Movies, TV, Audio). Picking a specific category can also unlock extra features like autocomplete.'
            ),
            placement: 'bottom',
            backdrop: true
        });

        createStepIfNew({
            stepId: 'selectAllCategory',
            selector: '#searchCategoryDropdownButton',
            order: 30,
            title: 'Selecting "All"',
            content: $sce.trustAsHtml(
                'We\'ll start with the <strong>"All"</strong> category to search across everything.'
            ),
            placement: 'bottom',
            backdrop: true,
            onNext: function () {
                return selectCategory('All');
            }
        });

        createStepIfNew({
            stepId: 'searchField',
            selector: '#searchfield',
            order: 40,
            title: 'Search Query',
            content: $sce.trustAsHtml(
                'This is where you type your search terms. We\'ll search for <strong>"linux"</strong> as an example.'
            ),
            placement: 'bottom',
            backdrop: true,
            onNext: function () {
                return typeIntoField('#searchfield', 'linux', 50);
            }
        });

        createStepIfNew({
            stepId: 'searchFieldFilled',
            selector: '#searchfield',
            order: 50,
            title: 'Query Entered',
            content: $sce.trustAsHtml(
                'We\'ve typed "linux" into the search field. Notice the typing animation — that\'s just for the tour.'
            ),
            placement: 'bottom',
            backdrop: true
        });

        createStepIfNew({
            stepId: 'goButton',
            selector: '#startsearch',
            order: 60,
            title: 'Go!',
            content: $sce.trustAsHtml(
                'Click the <strong>Go!</strong> button to search all your configured indexers. ' +
                'In this demo, we\'ll get mock results so no real indexers are contacted.'
            ),
            placement: 'bottom',
            backdrop: true,
            onNext: function () {
                // Trigger the search
                var goBtn = document.querySelector('#startsearch');
                if (goBtn) {
                    var scope = angular.element(goBtn).scope();
                    if (scope && scope.initiateSearch) {
                        scope.initiateSearch();
                    }
                }
                // Wait for results to load, then wait for the resultsTable step
                return tour.waitFor('resultsTable');
            }
        });

        // Phase 5: Movie Search with Autocomplete (steps 24-30)
        // These steps appear after Phase 4 navigates back to the search page
        createStepIfNew({
            stepId: 'movieSearchIntro',
            selector: '#searchfield',
            order: 240,
            title: 'Movie Search with Autocomplete',
            content: $sce.trustAsHtml(
                'Now let\'s try something cool — a movie search with autocomplete! ' +
                'When you pick a movie or TV category, you can search by title and get suggestions with poster images.'
            ),
            placement: 'bottom',
            orphan: true,
            backdrop: true,
            onShow: function () {
                // Clear the search field and selected item
                var el = document.querySelector('#searchfield');
                if (el) {
                    var scope = angular.element(el).scope();
                    if (scope) {
                        scope.query = '';
                        scope.selectedItem = null;
                        scope.$apply();
                    }
                }
                return $timeout(angular.noop, 200);
            }
        });

        createStepIfNew({
            stepId: 'selectMovieCategory',
            selector: '#searchCategoryDropdownButton',
            order: 250,
            title: 'Selecting "Movies"',
            content: $sce.trustAsHtml(
                'We\'ll switch to the <strong>Movies</strong> category. This enables autocomplete with TMDB data.'
            ),
            placement: 'bottom',
            backdrop: true,
            onNext: function () {
                return selectCategory('Movies');
            }
        });

        createStepIfNew({
            stepId: 'movieAutocompleteExplain',
            selector: '#searchfield',
            order: 260,
            title: 'Autocomplete Search',
            content: $sce.trustAsHtml(
                'With a movie category selected, typing a title shows autocomplete suggestions from <strong>The Movie Database (TMDB)</strong>. ' +
                'These come with poster images and year info. Selecting one searches by the movie\'s unique ID for more accurate results.'
            ),
            placement: 'bottom',
            backdrop: true,
            onNext: function () {
                return typeIntoField('#searchfield', 'Interstellar', 60);
            }
        });

        createStepIfNew({
            stepId: 'autocompleteDropdown',
            selector: '.dropdown-menu',
            order: 270,
            title: 'Autocomplete Results',
            content: $sce.trustAsHtml(
                'Here are the autocomplete suggestions! Each shows the movie title, year, and a poster image. ' +
                'Select one to search by its database ID.'
            ),
            placement: 'bottom',
            backdrop: true,
            onNext: function () {
                // Select the first autocomplete item
                var items = document.querySelectorAll('.dropdown-menu .uib-typeahead-match a');
                if (items.length > 0) {
                    angular.element(items[0]).triggerHandler('click');
                    // Also try triggering mousedown + click for typeahead
                    items[0].dispatchEvent(new MouseEvent('mousedown', {bubbles: true}));
                }
                return $timeout(angular.noop, 500);
            }
        });

        createStepIfNew({
            stepId: 'movieSelected',
            selector: '#selected-item-title',
            order: 280,
            title: 'Movie Selected',
            content: $sce.trustAsHtml(
                'The selected movie is shown here. The search will now use its TMDB ID for precise results. ' +
                'You can clear it with the small X button.'
            ),
            placement: 'bottom',
            backdrop: true
        });

        createStepIfNew({
            stepId: 'movieGoButton',
            selector: '#startsearch',
            order: 290,
            title: 'Search for the Movie',
            content: $sce.trustAsHtml(
                'Let\'s hit <strong>Go!</strong> again to search for Interstellar releases.'
            ),
            placement: 'bottom',
            backdrop: true,
            onNext: function () {
                var goBtn = document.querySelector('#startsearch');
                if (goBtn) {
                    var scope = angular.element(goBtn).scope();
                    if (scope && scope.initiateSearch) {
                        scope.initiateSearch();
                    }
                }
                return tour.waitFor('displayOptions');
            }
        });
    }
}
