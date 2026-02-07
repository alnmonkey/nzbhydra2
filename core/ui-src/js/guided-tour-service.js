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
    var enterKeyListener = null;
    // Pending waitFor target step ID. Set before a state transition that
    // destroys the ui-tour directive.  After the directive is recreated
    // and registerSearchSteps() is called with the new tour instance,
    // we re-issue tour.waitFor(pendingWaitForStepId) on the new tour so
    // the tour resumes once the target step is added (e.g. by
    // registerResultsSteps()).
    var pendingWaitForStepId = null;

    return service;


    // ─── Tour Lifecycle ────────────────────────────────────────────

    function startTour() {
        console.log('[TOUR] startTour() called');
        return $http.put('internalapi/demomode').then(function () {
            console.log('[TOUR] Demo mode activated');
            tourActive = true;
            registeredStepIds = {};
            injectFakeDownloader();

            tour = uiTourService.getTour();
            if (!tour) {
                console.error('[TOUR] No tour found. Make sure ui-tour directive exists.');
                endTour();
                return;
            }

            // Add Enter key listener to advance tour
            if (enterKeyListener) {
                document.removeEventListener('keydown', enterKeyListener);
            }
            enterKeyListener = function (e) {
                if (e.key === 'Enter' && tour && tour.getStatus() === tour.Status.ON) {
                    e.preventDefault();
                    tour.next();
                }
            };
            document.addEventListener('keydown', enterKeyListener);

            console.log('[TOUR] Starting tour...');
            return tour.start();
        }, function (err) {
            growl.error('Could not activate demo mode. Tour cannot start.');
            console.error('[TOUR] Failed to activate demo mode', err);
        });
    }

    function endTour() {
        console.log('[TOUR] endTour() called');
        tourActive = false;
        // Remove Enter key listener
        if (enterKeyListener) {
            document.removeEventListener('keydown', enterKeyListener);
            enterKeyListener = null;
        }
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
                // Blur the field so that pressing Enter advances the tour
                // instead of triggering the ng-enter search handler.
                el[0].blur();
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
            console.log('[TOUR] Step already registered, skipping: ' + config.stepId);
            return;
        }
        console.log('[TOUR] Creating step: ' + config.stepId + ' (order=' + config.order + ')');
        console.log('[TOUR] Tour status before createStep: ' + tour.getStatus());
        var steps = (typeof tour._getSteps === 'function') ? tour._getSteps() : null;
        var internalStepsBefore = steps ? steps.length : '?';
        tour.createStep(config);
        steps = (typeof tour._getSteps === 'function') ? tour._getSteps() : null;
        var internalStepsAfter = steps ? steps.length : '?';
        console.log('[TOUR] Steps count: ' + internalStepsBefore + ' -> ' + internalStepsAfter);
        registeredStepIds[config.stepId] = true;
    }

    /**
     * IDs of all steps registered in registerResultsSteps().
     * Used by clearResultsSteps() to remove them before re-registration
     * on the second results visit (Phase 6), which otherwise would hang
     * because createStepIfNew + addStep both skip already-known steps.
     */

    /**
     * Clears all results-phase step IDs from our registeredStepIds guard
     * and removes matching steps from the tour's internal step array.
     * This allows registerResultsSteps() to re-create them as fresh objects
     * so that addStep() fires the waitFor() callback on the second results visit.
     */
    function clearResultsSteps() {
        if (!tour) {
            return;
        }
        var currentStep = tour.getCurrentStep ? tour.getCurrentStep() : null;
        var currentStepId = currentStep ? currentStep.stepId : null;
        console.log('[TOUR] clearResultsSteps() called, currentStep=' + currentStepId +
            ' tourStatus=' + tour.getStatus());
        var idsToRemove = [
            'resultsTable', 'sortByAge', 'trySortByAge', 'titleFilter', 'tryFilter',
            'quickFilterButtons', 'downloadIcon', 'downloadSuccess', 'directDownload',
            'resultCheckbox', 'clickCheckbox', 'tryShiftClick',
            'selectionButton', 'bulkDownload', 'bulkDownloadDone',
            'displayOptions', 'qualityIndicators', 'wrapUp'
        ];
        var removed = 0;
        for (var i = 0; i < idsToRemove.length; i++) {
            var id = idsToRemove[i];
            delete registeredStepIds[id];
            // Try to remove from tour's internal step array if possible
            try {
                if (typeof tour._getSteps === 'function') {
                    var internalSteps = tour._getSteps();
                    if (internalSteps) {
                        for (var j = internalSteps.length - 1; j >= 0; j--) {
                            if (internalSteps[j].stepId === id) {
                                tour.removeStep(internalSteps[j]);
                                removed++;
                                break;
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn('[TOUR] clearResultsSteps: error removing step "' + id + '":', e);
            }
        }
        console.log('[TOUR] clearResultsSteps() removed ' + removed + ' steps from tour internal array');
    }

    function registerResultsSteps() {
        var tourStatus = tour ? tour.getStatus() : -1;
        console.log('[TOUR] registerResultsSteps() called, tourActive=' + tourActive +
            ' tourStatus=' + tourStatus + ' hasResultsTable=' + (registeredStepIds['resultsTable'] || false));
        if (!tour) {
            console.log('[TOUR] registerResultsSteps() - no tour instance, returning');
            return;
        }

        // Guard: onFinishRender fires every time the ng-repeat re-renders
        // (sorting, filtering, etc.).  If results steps are already
        // registered and the tour is actively ON we must NOT clear and
        // re-create them — doing so removes the currently displayed step
        // from the tour's internal stepList, which causes getStepByOffset()
        // to return stepList[0] (the "welcome" step) on the next "Next"
        // click, resetting the tour.
        // We only allow re-registration when the tour is WAITING or PAUSED
        // (the Phase 5→6 transition) or when steps haven't been created yet.
        if (registeredStepIds['resultsTable'] && tourStatus === tour.Status.ON) {
            console.log('[TOUR] registerResultsSteps() - results steps already registered and tour is ON, skipping re-registration');
            return;
        }

        // On the second visit to results (Phase 6), we must clear old step
        // objects so that createStepIfNew + addStep create fresh ones and
        // the waitFor('displayOptions') callback fires. On the first visit
        // this is a harmless no-op since no results steps exist yet.
        clearResultsSteps();

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
                '<div class="tour-user-action">Click the "Age" column header to sort by age.</div>' +
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
                '<div class="tour-user-action">Type a word into the filter box to narrow the results.</div>' +
                'When you\'re done experimenting, click "Next" to continue.'
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
                '<div class="tour-user-action">Click this checkbox to select the first result.</div>' +
                'Then click "Next".'
            ),
            placement: 'right'
        });

        createStepIfNew({
            stepId: 'tryShiftClick',
            selector: '#tour-shift-click-target',
            order: 190,
            title: 'Shift+Click for Range',
            content: $sce.trustAsHtml(
                'Hold <strong>Shift</strong> and click <strong>this</strong> checkbox to select all results between your first click and this one. ' +
                'This is great for grabbing a batch of results quickly.' +
                '<div class="tour-user-action">Hold <strong>Shift</strong> and click this checkbox.</div>' +
                'Then click "Next" when you\'re ready.'
            ),
            placement: 'right',
            onShow: function () {
                // Dynamically mark a checkbox further down the list as the
                // Shift+Click target so it's highlighted by the backdrop and
                // the user can actually click it.  The previous step already
                // had the user click the first checkbox, so we pick the 4th
                // (index 3) to give a visible range selection.
                var checkboxes = document.querySelectorAll('.result-checkbox');
                var targetIndex = Math.min(3, checkboxes.length - 1);
                if (checkboxes.length > 0 && targetIndex >= 0) {
                    checkboxes[targetIndex].id = 'tour-shift-click-target';
                }
            },
            onHide: function () {
                // Clean up the temporary ID
                var el = document.getElementById('tour-shift-click-target');
                if (el) {
                    el.removeAttribute('id');
                }
            }
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
                // Navigate back to search page for Phase 5 (movie search).
                // Going from child state root.search.results to parent
                // root.search just removes the results view.
                console.log('[TOUR] bulkDownloadDone onNext: navigating to root.search');
                $state.go('root.search', {}, {inherit: true, notify: true, reload: false});
                // Pause the tour to hide the current popover and backdrop,
                // then schedule startAt() for the movie search phase.
                // Return $q.reject() to stop goTo() from advancing sequentially.
                pendingWaitForStepId = 'movieSearchIntro';
                console.log('[TOUR] bulkDownloadDone onNext: pausing tour, scheduling startAt("movieSearchIntro")');
                return tour.pause().then(function () {
                    $timeout(function () {
                        if (tour && tour.hasStep('movieSearchIntro')) {
                            console.log('[TOUR] Starting at movieSearchIntro');
                            pendingWaitForStepId = null;
                            tour.startAt('movieSearchIntro');
                        }
                    }, 300);
                    // Throw instead of return $q.reject() to stop goTo()'s
                    // hide/show chain.  throw rejects the outer promise directly
                    // via processQueue's try/catch without creating an intermediate
                    // rejected promise that Angular flags as "unhandled rejection".
                    throw 'tour_paused';
                });
            }
        });

        // Phase 6: Display Options (single step — just highlight)
        createStepIfNew({
            stepId: 'displayOptions',
            selector: '#display-options',
            order: 310,
            title: 'Display Options',
            content: $sce.trustAsHtml(
                'This dropdown lets you customize how results are displayed. You can toggle things like ' +
                '<strong>duplicate grouping</strong>, <strong>movie covers</strong>, <strong>episode grouping</strong>, and more.<br><br>' +
                'Feel free to explore these options on your own after the tour!'
            ),
            placement: 'left'
        });

        if (ConfigService.getSafe().searching.showQualityIndicator) {
            createStepIfNew({
                stepId: 'qualityIndicators',
                selector: '.quality-badge',
                order: 330,
                title: 'Quality Indicators',
                content: $sce.trustAsHtml(
                    'These quality indicators estimate the overall quality of a movie release, scored from <strong>1</strong> to <strong>10</strong>.'
                ),
                placement: 'right'
            });
        }

        if (ConfigService.getSafe().searching.showQuickFilterButtons) {
            createStepIfNew({
                stepId: 'quickFilterButtons',
                selector: '.filter-button',
                order: 340,
                title: 'Quick Filter Buttons',
                content: $sce.trustAsHtml(
                    'These buttons let you quickly filter by video source (HDTV, Blu-Ray, WEB, etc.) or quality (720p, 1080p, 2160p). ' +
                    'Click one to toggle it on or off.'
                ),
                placement: 'bottom'
            });
        }

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

        // ── Fallback: manually resume tour if stuck ──────────────────
        // angular-ui-tour uses ES2017 async/await internally but
        // returns AngularJS $q promises.  When resumeWhenFound() is
        // called synchronously from addStep(), the native 'await' on
        // $q.resolve() inside showStep() can stall because no
        // AngularJS digest cycle is triggered.  This $timeout fires
        // inside a digest and calls startAt() to reliably show the
        // first results step.
        //
        // Determine which step to resume at:
        //   Phase 1→2 transition: pendingWaitForStepId === 'resultsTable'
        //   Phase 5→6 transition: pendingWaitForStepId === 'displayOptions'
        // If pendingWaitForStepId is null the waitFor/resumeWhenFound
        // mechanism on the live tour may still be stuck, so we also
        // fall back based on tour status alone.
        $timeout(function () {
            if (!tour) {
                return;
            }
            var status = tour.getStatus();
            console.log('[TOUR] registerResultsSteps fallback check: status=' + status +
                ' pendingWaitFor=' + pendingWaitForStepId);
            if (status === tour.Status.WAITING || status === tour.Status.PAUSED) {
                var targetStepId = pendingWaitForStepId || 'resultsTable';
                var step = tour.hasStep(targetStepId) ? targetStepId : null;
                if (step) {
                    console.log('[TOUR] Tour stuck in status ' + status +
                        ', manually starting at "' + targetStepId + '"');
                    pendingWaitForStepId = null;
                    tour.startAt(targetStepId);
                } else {
                    console.warn('[TOUR] Fallback: target step "' + targetStepId +
                        '" not found in tour step list');
                }
            }
        }, 200);
    }


    // ─── Search Page Steps (Phase 1 + Phase 5) ────────────────────
    // These are registered from SearchController when the tour directive initializes

    function registerSearchSteps(tourInstance) {
        console.log('[TOUR] registerSearchSteps() called, pendingWaitFor=' + pendingWaitForStepId);
        tour = tourInstance;
        // Clear previously registered step IDs — the old tour instance
        // (and its internal step array) was destroyed.  All steps must
        // be re-created on the new tour instance.
        registeredStepIds = {};

        // Phase 1: Basic Search (steps 1-7)
        createStepIfNew({
            stepId: 'welcome',
            selector: '#searchfield',
            order: 10,
            title: 'Welcome to the Tour!',
            content: $sce.trustAsHtml(
                'This tour will walk you through searching and browsing results in NZBHydra2. ' +
                'We\'ll cover searching, filtering, sorting, downloading, and customizing your experience.<br><br>' +
                'Most steps happen <strong>automatically</strong>. ' +
                'When it\'s <em>your</em> turn to try something, you\'ll see a prompt like this:' +
                '<div class="tour-user-action">Try clicking the column header to sort by age.</div>' +
                'Press <strong>Enter</strong> or click <strong>Next</strong> to continue!'
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
                '(e.g., Movies, TV, Audio). Picking a specific category can also unlock extra features like autocomplete and will almost always produce better results.'
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
            placement: 'left',
            backdrop: true,
            onNext: function () {
                // Trigger the search
                console.log('[TOUR] goButton onNext: triggering search');
                var goBtn = document.querySelector('#startsearch');
                if (goBtn) {
                    var scope = angular.element(goBtn).scope();
                    if (scope && scope.initiateSearch) {
                        console.log('[TOUR] goButton onNext: calling scope.initiateSearch()');
                        scope.initiateSearch();
                    } else {
                        console.error('[TOUR] goButton onNext: initiateSearch not found on scope');
                    }
                } else {
                    console.error('[TOUR] goButton onNext: #startsearch element not found');
                }
                // Save the waitFor target so it survives the ui-tour
                // directive being destroyed and recreated during the
                // root.search → root.search.results state transition.
                pendingWaitForStepId = 'resultsTable';
                console.log('[TOUR] goButton onNext: saved pendingWaitForStepId="resultsTable", calling tour.waitFor');
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
                // Clear the search field and selected item.
                // Use $timeout instead of $apply() to avoid "$digest already
                // in progress" errors — onShow is often called from within a
                // $timeout chain that is already inside a digest cycle.
                var el = document.querySelector('#searchfield');
                if (el) {
                    var scope = angular.element(el).scope();
                    if (scope) {
                        $timeout(function () {
                            scope.query = '';
                            scope.selectedItem = null;
                        });
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
                'The tour will automatically select the first result for you.'
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
                // Fix: uib-typeahead may bind the full item object to query after
                // our click trigger. Clean it up after a tick so the search field
                // doesn't show "[object Object]".
                return $timeout(function () {
                    var searchField = document.querySelector('#searchfield');
                    if (searchField) {
                        var searchScope = angular.element(searchField).scope();
                        if (searchScope) {
                            if (typeof searchScope.query === 'object' || (searchScope.query && searchScope.query.toString() === '[object Object]')) {
                                searchScope.query = '';
                            }
                            if (!searchScope.selectedItem && searchScope.selectAutocompleteItem) {
                                // The onSelect callback didn't fire — manually invoke it
                                // with the data from the first autocomplete match
                                var firstMatch = items[0];
                                var matchScope = angular.element(firstMatch).scope();
                                if (matchScope && matchScope.match && matchScope.match.model) {
                                    searchScope.selectAutocompleteItem(matchScope.match.model);
                                }
                            }
                            searchScope.$apply();
                        }
                        // Blur the field and hide the autocomplete dropdown.
                        // When advancing via Enter the field keeps focus and
                        // the dropdown stays visible — closing it explicitly
                        // ensures consistent behaviour regardless of input method.
                        searchField.blur();
                        searchField.dispatchEvent(new KeyboardEvent('keydown', {
                            key: 'Escape',
                            keyCode: 27,
                            which: 27,
                            bubbles: true
                        }));
                    }
                    document.body.dispatchEvent(new MouseEvent('click', {bubbles: true}));
                    // Hide the typeahead dropdown in case it's still open
                    var dropdown = document.querySelector('.uib-typeahead-popup');
                    if (dropdown) {
                        var dropdownScope = angular.element(dropdown).scope();
                        if (dropdownScope && angular.isDefined(dropdownScope.isOpen)) {
                            dropdownScope.isOpen = false;
                            dropdownScope.$applyAsync();
                        }
                        dropdown.classList.add('ng-hide');
                        dropdown.style.display = 'none';
                    }
                }, 500);
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
            placement: 'left',
            backdrop: true,
            onNext: function () {
                console.log('[TOUR] movieGoButton onNext: triggering movie search');
                var goBtn = document.querySelector('#startsearch');
                if (goBtn) {
                    var scope = angular.element(goBtn).scope();
                    if (scope && scope.initiateSearch) {
                        console.log('[TOUR] movieGoButton onNext: calling scope.initiateSearch()');
                        scope.initiateSearch();
                    } else {
                        console.error('[TOUR] movieGoButton onNext: initiateSearch not found on scope');
                    }
                } else {
                    console.error('[TOUR] movieGoButton onNext: #startsearch element not found');
                }
                // Save the waitFor target so it survives the ui-tour
                // directive being destroyed and recreated during the
                // root.search → root.search.results state transition.
                pendingWaitForStepId = 'displayOptions';
                console.log('[TOUR] movieGoButton onNext: saved pendingWaitForStepId="displayOptions", calling tour.waitFor');
                return tour.waitFor('displayOptions');
            }
        });

        // If there is a pending waitFor (saved before a state transition
        // destroyed the old tour), set up a listener to resume the tour
        // when the target step is added by registerResultsSteps().
        //
        // We cannot call tour.waitFor() here because the new tour has no
        // current step, and waitFor() internally calls pause() which
        // calls hideStep(null) and throws.  Instead we listen for the
        // 'stepAdded' event and call startAt() which works on a fresh tour.
        if (pendingWaitForStepId) {
            var stepId = pendingWaitForStepId;
            pendingWaitForStepId = null;
            console.log('[TOUR] Setting up stepAdded listener for pending step "' + stepId + '" on new tour instance');
            var onStepAdded = function (step) {
                if (step.stepId === stepId) {
                    console.log('[TOUR] Pending step "' + stepId + '" found! Starting tour at that step.');
                    tour.removeListener('stepAdded', onStepAdded);
                    tour.startAt(step);
                }
            };
            tour.on('stepAdded', onStepAdded);
        }
    }
}
