/**
 * angular-ui-tour 0.9.4
 * Adapted from https://github.com/benmarch/angular-ui-tour
 *
 * Converted from ES module source to plain AngularJS.
 * - No async/await: all async methods use $q .then() chains.
 * - digest() uses $timeout(angular.noop, 0) instead of $q.resolve()
 *   so that a real AngularJS digest cycle is triggered.
 * - EventEmitter replaced with a simple inline implementation.
 * - Templates registered in $templateCache.
 * - Tether and Hone are expected as globals (loaded via bower).
 */

(function () {
    'use strict';

    // ─── Simple EventEmitter ─────────────────────────────────────
    function SimpleEventEmitter() {
        this._listeners = {};
    }

    SimpleEventEmitter.prototype.on = function (event, fn) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(fn);
        return this;
    };

    SimpleEventEmitter.prototype.once = function (event, fn) {
        var self = this;
        var wrapper = function () {
            self.removeListener(event, wrapper);
            fn.apply(self, arguments);
        };
        wrapper._original = fn;
        return this.on(event, wrapper);
    };

    SimpleEventEmitter.prototype.emit = function (event) {
        var args = Array.prototype.slice.call(arguments, 1);
        var listeners = this._listeners[event];
        if (listeners) {
            // Copy to avoid mutation during iteration
            var copy = listeners.slice();
            for (var i = 0; i < copy.length; i++) {
                copy[i].apply(this, args);
            }
        }
        return this;
    };

    SimpleEventEmitter.prototype.removeListener = function (event, fn) {
        var listeners = this._listeners[event];
        if (listeners) {
            for (var i = listeners.length - 1; i >= 0; i--) {
                if (listeners[i] === fn || listeners[i]._original === fn) {
                    listeners.splice(i, 1);
                }
            }
        }
        return this;
    };

    SimpleEventEmitter.prototype.off = SimpleEventEmitter.prototype.removeListener;

    SimpleEventEmitter.prototype.removeAllListeners = function (event) {
        if (event) {
            delete this._listeners[event];
        } else {
            this._listeners = {};
        }
        return this;
    };


    // ─── Position Map ────────────────────────────────────────────
    var positionMap = {
        'top': {target: 'top center', popup: 'bottom center'},
        'top-left': {target: 'top left', popup: 'bottom left'},
        'top-right': {target: 'top right', popup: 'bottom right'},
        'bottom': {target: 'bottom center', popup: 'top center'},
        'bottom-left': {target: 'bottom left', popup: 'top left'},
        'bottom-right': {target: 'bottom right', popup: 'top right'},
        'left': {target: 'middle left', popup: 'middle right'},
        'left-top': {target: 'top left', popup: 'top right'},
        'left-bottom': {target: 'bottom left', popup: 'bottom right'},
        'right': {target: 'middle right', popup: 'middle left'},
        'right-top': {target: 'top right', popup: 'top left'},
        'right-bottom': {target: 'bottom right', popup: 'bottom left'}
    };


    // ─── Module Definition ───────────────────────────────────────
    angular.module('bm.uiTour', [
        'ngSanitize',
        'duScroll',
        'cfp.hotkeys',
        'angular-bind-html-compile'
    ])
        .run(uiTourRun)
        .run(uiTourTemplates)
        .value('Tether', window.Tether)
        .value('Hone', window.Hone)
        .constant('positionMap', positionMap)
        .provider('TourConfig', TourConfig)
        .factory('uiTourBackdrop', uiTourBackdrop)
        .factory('TourHelpers', TourHelpers)
        .factory('uiTourService', uiTourService)
        .factory('TourStepService', TourStepService)
        .controller('uiTourController', uiTourController)
        .directive('uiTour', uiTourDirective)
        .directive('tourStep', tourStepDirective);


    // ─── Templates ───────────────────────────────────────────────
    uiTourTemplates.$inject = ['$templateCache'];

    function uiTourTemplates($templateCache) {
        $templateCache.put('tour-step-popup.html',
            '<div class="tourStep\n' +
            '            ui-tour-popup\n' +
            '            popover\n' +
            '            {{ tourStep.config(\'popupClass\') }}\n' +
            '            {{ tourStep.config(\'orphan\') ? \'ui-tour-popup-orphan\' : tourStep.config(\'placement\').split(\'-\')[0] + \' \' + tourStep.config(\'placement\') }}"\n' +
            '     ng-style="{\n' +
            '        visibility: \'hidden\',\n' +
            '        display: \'block\',\n' +
            '        position: tourStep.config(\'fixed\') || tourStep.config(\'orphan\') ? \'fixed\' : \'absolute\',\n' +
            '        zIndex: tourStep.config(\'backdropZIndex\') + 2\n' +
            '     }"\n' +
            '     tabindex="0"\n' +
            '     aria-hidden="{{ tour._getCurrentStep() !== tourStep }}">\n' +
            '\n' +
            '    <div class="arrow"></div>\n' +
            '    <div class="popover-inner tour-step-inner">\n' +
            '        <h3 class="popover-title tour-step-title" ng-bind="tourStep.config(\'title\')" ng-if="tourStep.config(\'title\')"></h3>\n' +
            '        <div class="popover-content tour-step-content"\n' +
            '             ng-include="tourStep.config(\'templateUrl\') || \'tour-step-template.html\'"></div>\n' +
            '    </div>\n' +
            '</div>\n'
        );

        $templateCache.put('tour-step-template.html',
            '<div>\n' +
            '    <div class="popover-content tour-step-content" bind-html-compile="tourStep.trustedContent || tourStep.content"></div>\n' +
            '    <div class="popover-navigation tour-step-navigation">\n' +
            '        <div class="btn-group">\n' +
            '            <button type="button" class="btn btn-sm btn-default" ng-if="tourStep.isPrev()" ng-click="tour.prev()">&laquo; Prev</button>\n' +
            '            <button type="button" class="btn btn-sm btn-default" ng-if="tourStep.isNext()" ng-click="tour.next()">Next &raquo;</button>\n' +
            '        </div>\n' +
            '        <button type="button" class="btn btn-sm btn-default" ng-if="!tourStep.isPrev()" ng-click="tour.notNow()">Not now</button>\n' +
            '        <button type="button" class="btn btn-sm btn-default" ng-if="tourStep.isPrev()" ng-click="tour.end()">End tour</button>\n' +
            '    </div>\n' +
            '</div>\n'
        );
    }


    // ─── Run Block ───────────────────────────────────────────────
    uiTourRun.$inject = ['TourConfig', 'uiTourService', '$rootScope', '$injector'];

    function uiTourRun(TourConfig, uiTourService, $rootScope, $injector) {
        function checkAndKillToursOnNavigate() {
            if (!uiTourService.isTourWaiting()) {
                uiTourService.endAllTours();
            }
        }

        if (TourConfig.areNavigationInterceptorsEnabled()) {
            $rootScope.$on('$locationChangeStart', checkAndKillToursOnNavigate);
            $rootScope.$on('$stateChangeStart', checkAndKillToursOnNavigate);
            if ($injector.has('$transitions')) {
                $injector.get('$transitions').onStart({}, checkAndKillToursOnNavigate);
            }
        }
    }


    // ─── TourConfig Provider ─────────────────────────────────────
    function TourConfig() {
        var navigationInterceptorsEnabled = false,
            config = {
                placement: 'top',
                animation: true,
                popupDelay: 1,
                closePopupDelay: 0,
                enable: true,
                appendToBody: false,
                popupClass: '',
                orphan: false,
                backdrop: false,
                backdropZIndex: 10000,
                backdropPadding: '0px',
                disableBackdropOptimizations: false,
                scrollOffset: 100,
                scrollIntoView: true,
                useUiRouter: false,
                useHotkeys: false,
                scrollParentId: '$document',
                onStart: null,
                onEnd: null,
                onPause: null,
                onResume: null,
                onNext: null,
                onPrev: null,
                onShow: null,
                onShown: null,
                onHide: null,
                onHidden: null
            };

        this.set = function (option, value) {
            config[option] = value;
        };

        this.enableNavigationInterceptors = function () {
            navigationInterceptorsEnabled = true;
        };

        this.$get = ['$q', function ($q) {
            var service = {};

            service.get = function (option) {
                return config[option];
            };

            service.getAll = function () {
                return angular.copy(config);
            };

            service.areNavigationInterceptorsEnabled = function () {
                return navigationInterceptorsEnabled;
            };

            // wrap functions with promises
            (function () {
                angular.forEach(config, function (value, key) {
                    if (key.indexOf('on') === 0 && angular.isFunction(value)) {
                        config[key] = function () {
                            return $q.resolve(value());
                        };
                    }
                });
            }());

            return service;
        }];
    }


    // ─── Backdrop Service ────────────────────────────────────────
    uiTourBackdrop.$inject = ['$document', 'Hone'];

    function uiTourBackdrop($document, Hone) {
        var service = {},
            $body = angular.element($document[0].body),
            preventDefault = function (e) {
                e.preventDefault();
            },
            hone = new Hone({
                classPrefix: 'ui-tour-backdrop'
            });

        function preventScrolling() {
            $body.addClass('no-scrolling');
            $body.on('touchmove', preventDefault);
        }

        function allowScrolling() {
            $body.removeClass('no-scrolling');
            $body.off('touchmove', preventDefault);
        }

        /**
         * Fix the BOTTOM backdrop element's height so it covers the full
         * scrollable document, not just the viewport.
         *
         * Hone calculates the bottom height as:
         *   Math.max(bodyHeight - targetBottom, viewportHeight - targetBottom)
         * where viewportHeight is window.innerHeight.  When the page is
         * scrollable (e.g. after search results load), this leaves the
         * backdrop short of the actual document bottom.
         *
         * We fix this by reading the element's absolute top and computing
         * height = fullDocumentHeight - top.
         */
        function fixBottomBackdropHeight() {
            var bottomEl = hone.element
                ? hone.element.querySelector('.ui-tour-backdrop-component-bottom')
                : null;
            if (!bottomEl) {
                return;
            }
            var topPx = parseFloat(bottomEl.style.top);
            if (isNaN(topPx)) {
                return;
            }
            var fullHeight = Math.max(
                $document[0].body.scrollHeight,
                $document[0].documentElement.scrollHeight
            );
            var neededHeight = fullHeight - topPx;
            var currentHeight = parseFloat(bottomEl.style.height);
            if (isNaN(currentHeight) || neededHeight > currentHeight) {
                bottomEl.style.height = neededHeight + 'px';
            }
        }

        service.createForElement = function (element, backdropOptions) {
            hone.setOptions(backdropOptions);
            hone.position(element[0]);
            fixBottomBackdropHeight();
            hone.show();
            service.shouldPreventScrolling(!!backdropOptions.preventScrolling);
        };

        service.hide = function () {
            hone.hide();
            service.shouldPreventScrolling(false);
        };

        service.shouldPreventScrolling = function (should) {
            if (should === undefined) {
                should = true;
            }
            if (should) {
                preventScrolling();
            } else {
                allowScrolling();
            }
        };

        service.reposition = function () {
            if (hone.status === Hone.status.VISIBLE) {
                hone.position();
                fixBottomBackdropHeight();
            }
        };

        return service;
    }


    // ─── Tour Helpers ────────────────────────────────────────────
    TourHelpers.$inject = ['$http', '$compile', '$location', 'TourConfig', '$q', '$injector', '$timeout'];

    function TourHelpers($http, $compile, $location, TourConfig, $q, $injector, $timeout) {
        var helpers = {},
            safeApply,
            $state;

        if ($injector.has('$state')) {
            $state = $injector.get('$state');
        }

        safeApply = helpers.safeApply = function (scope, fn) {
            var phase = scope.$root.$$phase;
            if (phase === '$apply' || phase === '$digest') {
                if (fn && typeof fn === 'function') {
                    fn();
                }
            } else {
                scope.$apply(fn);
            }
        };

        function stringToBoolean(string) {
            if (string === 'true') {
                return true;
            }
            if (string === 'false') {
                return false;
            }
            return string;
        }

        helpers.attachTourConfigProperties = function (scope, attrs, step, properties) {
            angular.forEach(properties, function (property) {
                if (!attrs[helpers.getAttrName(property)] && angular.isDefined(step.config(property))) {
                    attrs.$set(helpers.getAttrName(property), String(step.config(property)));
                }
            });
        };

        helpers.attachEventHandlers = function (scope, attrs, options, events, prefix) {
            angular.forEach(events, function (eventName) {
                var attrName = helpers.getAttrName(eventName, prefix);
                if (attrs[attrName]) {
                    options[eventName] = function () {
                        return $q(function (resolve) {
                            safeApply(scope, function () {
                                resolve(scope.$eval(attrs[attrName]));
                            });
                        });
                    };
                }
            });
        };

        helpers.attachInterpolatedValues = function (attrs, options, keys, prefix) {
            angular.forEach(keys, function (key) {
                var attrName = helpers.getAttrName(key, prefix);
                if (attrs[attrName]) {
                    options[key] = stringToBoolean(attrs[attrName]);
                    attrs.$observe(attrName, function (newValue) {
                        options[key] = stringToBoolean(newValue);
                    });
                }
            });
        };

        helpers.setRedirect = function (step, ctrl, direction, path, targetName) {
            var oldHandler = step[direction];
            step[direction] = function (tour) {
                return $q(function (resolve) {
                    if (oldHandler) {
                        oldHandler(tour);
                    }
                    ctrl.waitFor(targetName);
                    if (step.config('useUiRouter')) {
                        $state.go(path).then(resolve);
                    } else {
                        $location.path(path);
                        $timeout(resolve);
                    }
                });
            };
        };

        helpers.getAttrName = function (option, prefix) {
            return (prefix || 'tourStep') + option.charAt(0).toUpperCase() + option.substr(1);
        };

        return helpers;
    }


    // ─── Tour Service ────────────────────────────────────────────
    uiTourService.$inject = ['$controller', '$q'];

    function uiTourService($controller, $q) {
        var service = {},
            tours = [];

        service.getTour = function () {
            return tours[0];
        };

        service.getTourByName = function (name) {
            return tours.filter(function (tour) {
                return tour.options.name === name;
            })[0];
        };

        service.getTourByElement = function (element) {
            return angular.element(element).controller('uiTour');
        };

        service.createDetachedTour = function (name, config) {
            if (!name) {
                throw {
                    name: 'ParameterMissingError',
                    message: 'A unique tour name is required for creating a detached tour.'
                };
            }
            config = config || {};
            config.name = name;
            return $controller('uiTourController').init(config);
        };

        service.isTourWaiting = function () {
            return tours.reduce(function (isWaiting, tour) {
                return isWaiting || tour.getStatus() === tour.Status.WAITING;
            }, false);
        };

        service.endAllTours = function () {
            return $q.all(tours.map(function (tour) {
                return tour.end();
            }));
        };

        service._registerTour = function (tour) {
            tours.push(tour);
        };

        service._unregisterTour = function (tour) {
            tours.splice(tours.indexOf(tour), 1);
        };

        return service;
    }


    // ─── Tour Step Service ───────────────────────────────────────
    TourStepService.$inject = ['Tether', '$compile', '$document', '$templateCache', '$rootScope', '$window', '$q', '$timeout', 'positionMap', 'uiTourBackdrop'];

    function TourStepService(Tether, $compile, $document, $templateCache, $rootScope, $window, $q, $timeout, positionMap, uiTourBackdrop) {
        var service = {};
        var backdropScrollListener = null;

        var easeInOutQuad = function (t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        };

        function createPopup(step, tour) {
            var scope = angular.extend($rootScope.$new(), {
                    tourStep: step,
                    tour: tour
                }),
                popup = $compile($templateCache.get('tour-step-popup.html'))(scope),
                parent = step.config('appendToBody') ? angular.element($document[0].body) : step.element.parent();

            parent.append(popup);
            return popup;
        }

        function focusPopup(step) {
            if (!step.config('orphan') && step.config('scrollIntoView')) {
                var scrollParent = step.config('scrollParentId') === '$document'
                    ? $document
                    : angular.element($document[0].getElementById(step.config('scrollParentId')));

                scrollParent.duScrollToElementAnimated(step.popup, step.config('scrollOffset'), 500, easeInOutQuad)
                    .then(function () {
                        step.popup[0].focus();
                    }, function () { /* Failed to scroll */
                    });
            } else {
                step.popup[0].focus();
            }
        }

        function positionPopup(step) {
            if (step.config('orphan')) {
                return;
            }
            if (!step.tether) {
                step.tether = new Tether({
                    element: step.popup[0],
                    target: step.element[0],
                    attachment: positionMap[step.config('placement')].popup,
                    targetAttachment: positionMap[step.config('placement')].target,
                    constraints: [{
                        to: 'window',
                        attachment: 'together',
                        pin: true
                    }]
                });
                step.tether.position();
            } else {
                step.tether.enable();
                step.tether.position();
            }
        }

        function showPopup(step) {
            positionPopup(step);
            $window.scrollTo($window.scrollX, $window.scrollY + 1);
            $timeout(function () {
                step.popup.css({
                    visibility: 'visible',
                    display: 'block'
                });
                focusPopup(step);
            }, 100);
        }

        function hidePopup(step) {
            if (step.tether) {
                step.tether.disable();
            }
            step.popup[0].style.setProperty('display', 'none', 'important');
        }

        service.createStep = function (step, tour) {
            if (!step.element && !step.elementId && !step.selector) {
                throw {
                    name: 'PropertyMissingError',
                    message: 'Steps require an element, ID, or selector to be specified'
                };
            }

            step.config = function (option) {
                if (angular.isDefined(step[option])) {
                    return step[option];
                }
                return tour.config(option);
            };

            step.reposition = function () {
                if (step.tether) {
                    step.tether.position();
                }
            };

            if (!angular.isDefined(step.enabled)) {
                step.enabled = true;
            }

            return step;
        };

        service.showStep = function (step, tour) {
            if (step.elementId) {
                step.element = angular.element($document[0].getElementById(step.elementId));
            }
            if (step.selector) {
                step.element = angular.element($document[0].querySelector(step.selector));
            }
            if (!step.element) {
                throw 'No element found for step.';
            }
            if (step.config('backdrop')) {
                uiTourBackdrop.createForElement(step.element, {
                    preventScrolling: step.config('preventScrolling'),
                    fixed: step.config('fixed'),
                    borderRadius: step.config('backdropBorderRadius'),
                    padding: step.config('backdropPadding'),
                    fullScreen: step.config('orphan'),
                    disableOptimizations: step.config('disableBackdropOptimizations'),
                    events: {
                        click: step.config('onBackdropClick')
                    }
                });
                // Attach a debounced scroll listener to reposition the
                // backdrop overlay when the page scrolls (fixes §10.16:
                // backdrop not covering full document after scroll).
                if (backdropScrollListener) {
                    $window.removeEventListener('scroll', backdropScrollListener, true);
                }
                var repositionTimer = null;
                backdropScrollListener = function () {
                    if (repositionTimer) {
                        return;
                    }
                    repositionTimer = setTimeout(function () {
                        repositionTimer = null;
                        uiTourBackdrop.reposition();
                    }, 50);
                };
                $window.addEventListener('scroll', backdropScrollListener, true);
                // Also reposition once after the popup settles (the
                // showPopup call below triggers a small scrollTo + 100ms
                // timeout before showing the popup).
                $timeout(function () {
                    uiTourBackdrop.reposition();
                }, 250);
            }
            step.element.addClass('ui-tour-active-step');
            if (!step.popup) {
                step.popup = createPopup(step, tour);
            }
            showPopup(step);
        };

        service.hideStep = function (step) {
            hidePopup(step);
            step.element.removeClass('ui-tour-active-step');
            // Remove the backdrop scroll listener if active
            if (backdropScrollListener) {
                $window.removeEventListener('scroll', backdropScrollListener, true);
                backdropScrollListener = null;
            }
        };

        return service;
    }


    // ─── Tour Controller ─────────────────────────────────────────
    // All async methods converted from async/await to $q .then() chains.
    // digest() now uses $timeout to ensure a real AngularJS digest cycle.
    uiTourController.$inject = ['$timeout', '$q', '$filter', '$document', 'TourConfig', 'uiTourBackdrop', 'uiTourService', 'TourStepService', 'hotkeys'];

    function uiTourController($timeout, $q, $filter, $document, TourConfig, uiTourBackdrop, uiTourService, TourStepService, hotkeys) {
        var self = new SimpleEventEmitter(),
            stepList = [],
            currentStep = null,
            resumeWhenFound,
            TourStatus = {
                OFF: 0,
                ON: 1,
                PAUSED: 2,
                WAITING: 3
            },
            tourStatus = TourStatus.OFF,
            transitioning = false,
            options = TourConfig.getAll();

        /**
         * Triggers a real AngularJS digest cycle and resolves after it.
         * The original used $q.resolve() which stalls when called from
         * outside a digest (e.g. from native async/await or .then() chains
         * that resolved via native Promises).
         */
        function digest() {
            return $timeout(angular.noop, 0);
        }

        function getCurrentStep() {
            return currentStep;
        }

        function setCurrentStep(step) {
            currentStep = step;
        }

        function getStepByOffset(offset) {
            if (!getCurrentStep()) {
                return null;
            }
            if (getCurrentStep().config('nextPath') && offset > 0) {
                return null;
            }
            if (getCurrentStep().config('prevPath') && offset < 0) {
                return null;
            }
            return stepList[stepList.indexOf(getCurrentStep()) + offset];
        }

        function getStep(stepOrStepIdOrIndex) {
            if (angular.isNumber(stepOrStepIdOrIndex)) {
                return stepList[stepOrStepIdOrIndex];
            }
            if (angular.isString(stepOrStepIdOrIndex)) {
                return stepList.filter(function (step) {
                    return step.stepId === stepOrStepIdOrIndex;
                })[0];
            }
            if (angular.isObject(stepOrStepIdOrIndex)) {
                if (~stepList.indexOf(stepOrStepIdOrIndex)) {
                    return stepOrStepIdOrIndex;
                }
                if (stepOrStepIdOrIndex.stepId) {
                    return stepList.filter(function (step) {
                        return step.stepId === stepOrStepIdOrIndex.stepId;
                    })[0];
                }
            }
            return null;
        }

        function getNextStep() {
            return getStepByOffset(+1);
        }

        function getPrevStep() {
            return getStepByOffset(-1);
        }

        function isNext() {
            return !!(getNextStep() || (getCurrentStep() && (getCurrentStep().config('nextPath') || getCurrentStep().onNext)));
        }

        function isPrev() {
            return !!(getPrevStep() || (getCurrentStep() && (getCurrentStep().config('prevPath') || getCurrentStep().onPrev)));
        }

        /**
         * Safely invoke a possibly null event handler.
         * Returns a $q promise.
         */
        function handleEvent(handler) {
            if (handler) {
                try {
                    var result = handler();
                    // Wrap the result in $q.resolve so we always get a $q promise
                    return $q.resolve(result);
                } catch (e) {
                    return $q.reject(e);
                }
            }
            return digest();
        }

        function setHotKeys() {
            hotkeys.add({
                combo: 'esc',
                description: 'End tour',
                callback: function () {
                    self.end();
                }
            });
            hotkeys.add({
                combo: 'right',
                description: 'Go to next step',
                callback: function () {
                    if (isNext()) {
                        self.next();
                    }
                }
            });
            hotkeys.add({
                combo: 'left',
                description: 'Go to previous step',
                callback: function () {
                    if (isPrev()) {
                        self.prev();
                    }
                }
            });
        }

        function unsetHotKeys() {
            hotkeys.del('esc');
            hotkeys.del('right');
            hotkeys.del('left');
        }

        // ─── Protected API ───────────────────────────────────────

        self.addStep = function (step) {
            if (~stepList.indexOf(step)) {
                return;
            }
            stepList.push(step);
            stepList = $filter('orderBy')(stepList, 'order');
            self.emit('stepAdded', step);
            if (resumeWhenFound) {
                resumeWhenFound(step);
            }
        };

        self.removeStep = function (step) {
            var index = stepList.indexOf(step);
            if (index !== -1) {
                stepList.splice(index, 1);
                self.emit('stepRemoved', step);
            }
        };

        self.reorderStep = function (step) {
            self.removeStep(step);
            self.addStep(step);
            self.emit('stepsReordered', step);
        };

        self.hasStep = function (stepOrStepIdOrIndex) {
            return !!getStep(stepOrStepIdOrIndex);
        };

        /**
         * Show supplied step.
         * Converted from async to $q .then() chain.
         */
        self.showStep = function (step) {
            if (!step) {
                return $q.reject('No step.');
            }

            return handleEvent(step.config('onShow'))
                .then(function () {
                    TourStepService.showStep(step, self);
                    return digest();
                })
                .then(function () {
                    return handleEvent(step.config('onShown'));
                })
                .then(function () {
                    self.emit('stepShown', step);
                    step.isNext = isNext;
                    step.isPrev = isPrev;
                });
        };

        /**
         * Hide supplied step.
         * Converted from async to $q .then() chain.
         */
        self.hideStep = function (step) {
            if (!step) {
                return $q.reject('No step.');
            }

            return handleEvent(step.config('onHide'))
                .then(function () {
                    TourStepService.hideStep(step);
                    return digest();
                })
                .then(function () {
                    return handleEvent(step.config('onHidden'));
                })
                .then(function () {
                    self.emit('stepHidden', step);
                });
        };

        self.config = function (option) {
            return options[option];
        };

        self.init = function (opts) {
            options = angular.extend(options, opts);
            self.options = options;
            uiTourService._registerTour(self);
            self.initialized = true;
            self.emit('initialized');
            return self;
        };

        self.destroy = function () {
            uiTourService._unregisterTour(self);
        };

        // ─── Public API ──────────────────────────────────────────

        self.start = function () {
            return self.startAt(0);
        };

        /**
         * Start the tour at a specified step.
         * Converted from async to $q .then() chain.
         */
        self.startAt = function (stepOrStepIdOrIndex) {
            transitioning = false; // Reset guard — startAt is a fresh navigation
            return handleEvent(options.onStart)
                .then(function () {
                    var step = getStep(stepOrStepIdOrIndex);
                    setCurrentStep(step);
                    tourStatus = TourStatus.ON;
                    self.emit('started', step);
                    if (options.useHotkeys) {
                        setHotKeys();
                    }
                    return self.showStep(getCurrentStep());
                });
        };

        /**
         * End the tour.
         * Converted from async to $q .then() chain.
         */
        self.end = function () {
            transitioning = false; // Reset guard
            return handleEvent(options.onEnd)
                .then(function () {
                    if (getCurrentStep()) {
                        uiTourBackdrop.hide();
                        return self.hideStep(getCurrentStep());
                    }
                })
                .then(function () {
                    setCurrentStep(null);
                    self.emit('ended');
                    tourStatus = TourStatus.OFF;
                    resumeWhenFound = null;
                    if (options.useHotkeys) {
                        unsetHotKeys();
                    }
                });
        };

        /**
         * Pause the tour.
         * Converted from async to $q .then() chain.
         */
        self.pause = function () {
            return handleEvent(options.onPause)
                .then(function () {
                    tourStatus = TourStatus.PAUSED;
                    uiTourBackdrop.hide();
                    return self.hideStep(getCurrentStep());
                })
                .then(function () {
                    self.emit('paused', getCurrentStep());
                });
        };

        /**
         * Resume a paused tour.
         * Converted from async to $q .then() chain.
         */
        self.resume = function () {
            return handleEvent(options.onResume)
                .then(function () {
                    tourStatus = TourStatus.ON;
                    self.emit('resumed', getCurrentStep());
                    return self.showStep(getCurrentStep());
                });
        };

        self.next = function () {
            return self.goTo('$next');
        };

        self.prev = function () {
            return self.goTo('$prev');
        };

        /**
         * Jump to a step.
         * Converted from async to $q .then() chain.
         */
        self.goTo = function (goTo) {
            // Prevent overlapping transitions — if a transition is already
            // in progress, ignore this call.  This avoids race conditions
            // where rapid Enter presses / double-clicks start multiple
            // promise chains that leave stale popovers visible.
            if (transitioning) {
                return $q.reject('Transition in progress');
            }

            var cs = getCurrentStep(),
                stepToShow = getStep(goTo),
                actionMap = {
                    $prev: {
                        getStep: getPrevStep,
                        preEvent: 'onPrev',
                        navCheck: 'prevStep'
                    },
                    $next: {
                        getStep: getNextStep,
                        preEvent: 'onNext',
                        navCheck: 'nextStep'
                    }
                };

            transitioning = true;

            function clearTransitioning() {
                transitioning = false;
            }

            if (goTo === '$prev' || goTo === '$next') {
                return handleEvent(cs.config(actionMap[goTo].preEvent))
                    .then(function () {
                        return self.hideStep(cs);
                    })
                    .then(function () {
                        if (!cs[actionMap[goTo].navCheck] || cs[actionMap[goTo].navCheck] !== getCurrentStep().stepId) {
                            setCurrentStep(actionMap[goTo].getStep());
                            self.emit('stepChanged', getCurrentStep());
                        }
                        if (getCurrentStep() && !getCurrentStep().config('backdrop')) {
                            uiTourBackdrop.hide();
                        }
                        if (getCurrentStep() && !getCurrentStep().config('preventScrolling')) {
                            uiTourBackdrop.shouldPreventScrolling(false);
                        }
                        if (getCurrentStep()) {
                            return self.showStep(getCurrentStep());
                        }
                        return self.end();
                    })
                    .catch(angular.noop)
                    .finally(clearTransitioning);
            }

            // Direct step jump
            if (!stepToShow) {
                transitioning = false;
                return $q.reject('No step.');
            }

            return self.hideStep(getCurrentStep())
                .then(function () {
                    if (getCurrentStep().config('backdrop') && !stepToShow.config('backdrop')) {
                        uiTourBackdrop.hide();
                    }
                    if (getCurrentStep().config('backdrop') && !stepToShow.config('preventScrolling')) {
                        uiTourBackdrop.shouldPreventScrolling(false);
                    }
                    setCurrentStep(stepToShow);
                    self.emit('stepChanged', getCurrentStep());
                    return self.showStep(stepToShow);
                })
                .catch(angular.noop)
                .finally(clearTransitioning);
        };

        /**
         * Pause until a specific step is added.
         * Converted from async to $q .then() chain.
         */
        self.waitFor = function (waitForStep) {
            resumeWhenFound = function (step) {
                if (step.stepId === waitForStep) {
                    setCurrentStep(stepList[stepList.indexOf(step)]);
                    self.resume();
                    resumeWhenFound = null;
                }
            };
            return self.pause().then(function () {
                tourStatus = TourStatus.WAITING;
                // Throw instead of using deferred.reject() to signal
                // goTo() to stop its hide/show chain.  throw rejects the
                // outer promise directly via processQueue's try/catch
                // without creating an intermediate rejected promise that
                // Angular flags as "Possibly unhandled rejection".
                throw 'tour_waiting';
            });
        };

        self.createStep = function (opts) {
            var step = TourStepService.createStep(opts, self);
            if (self.initialized) {
                self.addStep(step);
            } else {
                self.once('initialized', function () {
                    self.addStep(step);
                });
            }
            return step;
        };

        self.getCurrentStep = function () {
            return getCurrentStep();
        };

        self.reposition = function () {
            if (getCurrentStep()) {
                getCurrentStep().reposition();
                uiTourBackdrop.reposition();
            }
        };

        self.getStatus = function () {
            return tourStatus;
        };

        self.Status = TourStatus;

        // Debugging helpers (same as original)
        self._getSteps = function () {
            return stepList;
        };
        self._getCurrentStep = getCurrentStep;
        self._setCurrentStep = setCurrentStep;

        return self;
    }


    // ─── Tour Directive ──────────────────────────────────────────
    uiTourDirective.$inject = ['TourHelpers'];

    function uiTourDirective(TourHelpers) {
        return {
            restrict: 'EA',
            scope: false,
            controller: 'uiTourController',
            link: function (scope, element, attrs, ctrl) {
                var tour = {
                        name: attrs.uiTour
                    },
                    events = 'onReady onStart onEnd onShow onShown onHide onHidden onNext onPrev onPause onResume onBackdropClick'.split(' '),
                    properties = 'placement animation popupDelay closePopupDelay enable appendToBody popupClass orphan backdrop backdropBorderRadius backdropPadding disableBackdropOptimizations scrollParentId scrollOffset scrollIntoView useUiRouter useHotkeys'.split(' ');

                TourHelpers.attachInterpolatedValues(attrs, tour, properties, 'uiTour');
                TourHelpers.attachEventHandlers(scope, attrs, tour, events, 'uiTour');

                if (attrs[TourHelpers.getAttrName('templateUrl', 'uiTour')]) {
                    tour.templateUrl = scope.$eval(attrs[TourHelpers.getAttrName('templateUrl', 'uiTour')]);
                }
                if (attrs[TourHelpers.getAttrName('options')]) {
                    angular.extend(tour, scope.$eval(attrs[TourHelpers.getAttrName('options')]));
                }

                scope.tour = ctrl.init(tour);
                if (typeof tour.onReady === 'function') {
                    tour.onReady();
                }

                scope.$on('$destroy', function () {
                    ctrl.destroy();
                });
            }
        };
    }


    // ─── Tour Step Directive ─────────────────────────────────────
    tourStepDirective.$inject = ['TourHelpers', 'uiTourService', '$sce'];

    function tourStepDirective(TourHelpers, uiTourService, $sce) {
        return {
            restrict: 'EA',
            scope: true,
            require: '?^uiTour',
            link: function (scope, element, attrs, uiTourCtrl) {
                var ctrl,
                    step,
                    events = 'onShow onShown onHide onHidden onNext onPrev onBackdropClick'.split(' '),
                    stepOptions = 'content title animation placement backdrop backdropBorderRadius backdropPadding disableBackdropOptimizations orphan popupDelay popupCloseDelay popupClass fixed preventScrolling scrollIntoView nextStep prevStep nextPath prevPath scrollOffset scrollParentId'.split(' '),
                    orderWatch,
                    enabledWatch,
                    contentWatch;

                if (attrs[TourHelpers.getAttrName('belongsTo')]) {
                    ctrl = uiTourService.getTourByName(attrs[TourHelpers.getAttrName('belongsTo')]);
                } else if (uiTourCtrl) {
                    ctrl = uiTourCtrl;
                }

                if (!ctrl) {
                    throw {
                        name: 'DependencyMissingError',
                        message: 'No tour provided for tour step.'
                    };
                }

                step = ctrl.createStep({
                    stepId: attrs.tourStep,
                    element: element
                });

                TourHelpers.attachInterpolatedValues(attrs, step, stepOptions);
                orderWatch = attrs.$observe(TourHelpers.getAttrName('order'), function (order) {
                    step.order = !isNaN(order * 1) ? order * 1 : 0;
                    if (ctrl.hasStep(step)) {
                        ctrl.reorderStep(step);
                    }
                });
                enabledWatch = attrs.$observe(TourHelpers.getAttrName('enabled'), function (isEnabled) {
                    step.enabled = isEnabled !== 'false';
                    if (step.enabled) {
                        ctrl.addStep(step);
                    } else {
                        ctrl.removeStep(step);
                    }
                });

                contentWatch = attrs.$observe(TourHelpers.getAttrName('content'), function (content) {
                    if (content) {
                        step.trustedContent = $sce.trustAsHtml(step.content);
                    }
                });

                TourHelpers.attachEventHandlers(scope, attrs, step, events);

                if (attrs[TourHelpers.getAttrName('templateUrl')]) {
                    step.templateUrl = scope.$eval(attrs[TourHelpers.getAttrName('templateUrl')]);
                }
                if (attrs[TourHelpers.getAttrName('options')]) {
                    angular.extend(step, scope.$eval(attrs[TourHelpers.getAttrName('options')]));
                }

                if (step.nextPath) {
                    step.redirectNext = true;
                    TourHelpers.setRedirect(step, ctrl, 'onNext', step.nextPath, step.nextStep);
                }
                if (step.prevPath) {
                    step.redirectPrev = true;
                    TourHelpers.setRedirect(step, ctrl, 'onPrev', step.prevPath, step.prevStep);
                }

                step.trustedContent = $sce.trustAsHtml(step.content);

                scope.tourStep = step;
                scope.tour = ctrl;

                Object.defineProperties(step, {
                    element: {value: element},
                    scope: {value: scope}
                });

                scope.$on('$destroy', function () {
                    ctrl.removeStep(step);
                    orderWatch();
                    enabledWatch();
                    contentWatch();
                });
            }
        };
    }

})();
