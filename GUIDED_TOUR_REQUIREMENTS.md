# Guided Tour Feature – Requirements & Design Document

## 1. Overview

A guided, interactive tour that walks users through the most important search and results features of NZBHydra2. The tour is accessible via a button on the search page and operates in a **demo mode** so that no real indexer calls are made.

---

## 2. User-Facing Behavior

### 2.1 Starting the Tour

- A small button (e.g., a question-mark or "Take a Tour" link) is **always visible on the search page**, placed near the search form (e.g., below the "Go!" button or in the form's footer area).
- Clicking it activates **demo mode** and begins the tour from step 1.
- The tour always **restarts from the beginning** if closed and re-opened.

### 2.2 Tour Flow (Step-by-Step)

The tour uses a **hybrid automation model**: some actions (filling fields, clicking buttons) are performed automatically by the tour, while others (checkbox selection, shift-click) are performed by the user with guidance.

#### Phase 1: Basic Search

| Step | Type      | Description                                                                                                                  |
|------|-----------|------------------------------------------------------------------------------------------------------------------------------|
| 1    | Info      | Welcome popover: "This tour will walk you through searching and browsing results."                                           |
| 2    | Highlight | Highlight the category dropdown. Explain that categories control what type of content is searched.                           |
| 3    | Auto      | Automatically select the **"All"** category (if not already selected).                                                       |
| 4    | Highlight | Highlight the search input field. Explain that this is where you enter your search query.                                    |
| 5    | Auto      | Automatically type **"linux"** into the search field (with a visible typing animation, ~50ms per character).                 |
| 6    | Highlight | Highlight the "Go!" button. Explain "Click Go! to search all configured indexers."                                           |
| 7    | Auto      | Automatically click the "Go!" button. The backend demo mode returns mock search results. The tour waits for results to load. |

#### Phase 2: Browsing Results

| Step | Type        | Description                                                                                                                     |
|------|-------------|---------------------------------------------------------------------------------------------------------------------------------|
| 8    | Highlight   | Highlight the results table. Explain the columns: title, indexer, category, size, grabs, age, links.                            |
| 9    | Highlight   | Highlight a column header (e.g., "Age"). Explain that clicking a column header sorts results by that column.                    |
| 10   | User action | Prompt user: "Try clicking the 'Age' column header to sort by age." Wait for the user to click.                                 |
| 11   | Highlight   | Highlight the title filter input. Explain: "Type here to filter results by title. Use `!word` to exclude, `/regex/` for regex." |
| 12   | User action | Prompt user: "Try typing a filter term." Wait briefly, then proceed.                                                            |
| 13   | Highlight   | Highlight the filter buttons (source/quality). Explain: "Use these buttons to quickly filter by video source or quality."       |

#### Phase 3: Downloading Single Results

| Step | Type      | Description                                                                                                                         |
|------|-----------|-------------------------------------------------------------------------------------------------------------------------------------|
| 14   | Highlight | Highlight the download icon(s) next to a result. Explain: "Click a downloader icon to send this single result to your downloader."  |
| 15   | Auto      | Automatically click a download icon. The backend demo mode returns a success response. Show the icon change to a success checkmark. |
| 16   | Highlight | Highlight the direct download link. Explain: "You can also download the NZB file directly by clicking this link."                   |

#### Phase 4: Multi-Select & Bulk Download

| Step | Type        | Description                                                                                                       |
|------|-------------|-------------------------------------------------------------------------------------------------------------------|
| 17   | Highlight   | Highlight the checkbox on a result row. Explain: "Use checkboxes to select multiple results for bulk actions."    |
| 18   | User action | Prompt user: "Click this checkbox to select a result."                                                            |
| 19   | Highlight   | Explain: "Hold **Shift** and click another checkbox to select all results between the two clicks."                |
| 20   | User action | Prompt user: "Try Shift+clicking another checkbox now."                                                           |
| 21   | Highlight   | Highlight the selection button (invert/select all/deselect all). Explain the bulk selection options.              |
| 22   | Highlight   | Highlight the "Download NZBs" button at the top. Explain: "Send all selected results to your downloader at once." |
| 23   | Auto        | Automatically click the download button. The demo mode returns a success response for all selected results.       |

#### Phase 5: Movie Search with Autocomplete

| Step | Type      | Description                                                                                                                                                        |
|------|-----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 24   | Info      | "Now let's try a movie search with autocomplete."                                                                                                                  |
| 25   | Auto      | Automatically select the **"Movies"** category from the dropdown.                                                                                                  |
| 26   | Highlight | Highlight the search input. Explain: "When a movie or TV category is selected, typing a title shows autocomplete suggestions with posters."                        |
| 27   | Auto      | Automatically type a movie name (e.g., **"Interstellar"**) into the search field. The demo mode returns mock autocomplete results (a list of movies with posters). |
| 28   | Highlight | Highlight the autocomplete dropdown. Explain: "Select a movie to search by its database IDs for more accurate results."                                            |
| 29   | Auto      | Automatically select the first autocomplete result.                                                                                                                |
| 30   | Auto      | Automatically click "Go!" and wait for mock results.                                                                                                               |

#### Phase 6: Display Options

| Step | Type        | Description                                                                                 |
|------|-------------|---------------------------------------------------------------------------------------------|
| 31   | Highlight   | Highlight the "Display options" button. Explain: "Customize how results are displayed."     |
| 32   | Auto        | Automatically open the display options dropdown.                                            |
| 33   | Highlight   | Highlight key options (group duplicates, show covers, expand groups). Explain each briefly. |
| 34   | User action | Prompt user: "Try toggling an option to see the effect."                                    |

#### Phase 7: Wrap-Up

| Step | Type | Description                                                                                                                                                                                |
|------|------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 35   | Info | Summary popover: "That's the tour! You now know how to search, filter, sort, download, and customize your results. You can restart this tour anytime using the button on the search page." |

### 2.3 Exiting the Tour

- The user can close the tour at any time by clicking an "X" button on any popover or pressing Escape.
- When the tour ends (completed or closed early), **demo mode is deactivated**.
- The page returns to its normal state (search results are cleared, category is reset to default).

---

## 3. Technical Architecture

### 3.1 Frontend: Tour Library

**Library:** [`angular-ui-tour`](https://github.com/benmarch/angular-ui-tour) (v0.9.4)

**Why this library:**

- Built on `angular-bootstrap` (specifically `uib-popover`) which NZBHydra2 already uses – guarantees visual consistency.
- Available via bower: `bower install angular-ui-tour`.
- Promise-based lifecycle hooks (`onNext`, `onShow`, etc.) – essential for waiting on async operations like search results loading.
- `tour.waitFor(stepId)` – essential for cross-view tours (search page → results view).
- `createStep()` API – steps can be defined programmatically from controllers.
- Explicit `ui-router` integration via `useUiRouter` config.
- MIT license (compatible with the project's Apache-2.0 license).

**Installation:**

```bash
bower install angular-ui-tour --save
```

This installs the following dependencies: `tether`, `hone`, `angular-hotkeys`, `angular-bind-html-compile`, `angular-scroll` (already present as `duScroll`).

**Integration:**

- Add `'bm.uiTour'` to the AngularJS module dependencies in `nzbhydra.js`.
- Include the library's CSS/JS files in the Gulp build pipeline (`gulpfile.js`).

### 3.2 Frontend: Tour Service & Controller

Create a new AngularJS service `GuidedTourService` that:

1. **Manages tour state** – tracks whether the tour is active, current step index.
2. **Activates/deactivates demo mode** – calls the backend to enable/disable demo mode before/after the tour.
3. **Defines all tour steps** – step definitions with element selectors, content, placement, and lifecycle hooks.
4. **Performs automated actions** – types text into fields, clicks buttons, selects dropdown items via Angular's `$scope` manipulation and `$timeout` for animations.
5. **Waits for async results** – uses promise-based hooks to wait for search results to load before proceeding to results-related steps.

**Key file locations:**

- `core/ui-src/js/guided-tour-service.js` – the tour service
- `core/ui-src/html/guided-tour-popover.html` – custom popover template (optional, for styling)
- Tour-specific CSS in existing stylesheets

### 3.3 Backend: Demo Mode

#### 3.3.1 Demo Mode Activation

A new REST endpoint pair:

```
PUT  /internalapi/demomode        → activates demo mode
DELETE /internalapi/demomode      → deactivates demo mode
```

Alternatively, since the existing `MockSearch` uses a static boolean pattern in `ExternalApi`, a similar approach can be used: a static `demoMode` flag in `SearchWeb` (the internal search controller).

However, a **session-scoped or request-header approach** is safer to avoid affecting other concurrent users:

- The frontend sends a custom header `X-Demo-Mode: true` with all requests during the tour.
- A servlet filter or Spring interceptor checks this header and routes to demo data instead of real indexer calls.

**Recommended approach:** Use a simple static boolean flag (like `MockSearch.inMockingMode`) since NZBHydra2 is typically a single-user application. The flag is set via the REST endpoint.

#### 3.3.2 Demo Mode Endpoints to Mock

When demo mode is active, the following endpoints return mock data instead of performing real operations:

| Endpoint                                        | Mock Behavior                                                          |
|-------------------------------------------------|------------------------------------------------------------------------|
| `POST /internalapi/search`                      | Returns realistic mock search results (see §3.3.3). No indexer calls.  |
| `GET /internalapi/autocomplete/{type}`          | Returns mock autocomplete results (see §3.3.4). No external API calls. |
| `PUT /internalapi/downloader/addNzbs`           | Returns a mock success response. No downloader communication.          |
| `GET /internalapi/downloader/{name}/categories` | Returns mock downloader categories.                                    |

#### 3.3.3 Mock Search Results

The mock search endpoint should return realistic results. The existing `NewznabMockBuilder` in `shared/mapping` already generates rich mock Newznab XML items. However, the internal search flow uses `SearchResultWebTO` (the web transfer
object), not Newznab XML.

**Approach:** Create a new class `DemoDataProvider` (or similar) in the `core` module that:

1. Generates a `SearchResponse` with 20-50 `SearchResultWebTO` items.
2. Items have realistic data:
    - Varied titles based on the search query (e.g., "Linux Mint 21.3 x64", "Ubuntu 24.04 LTS", "Arch Linux 2024.01" for query "linux"; or "Interstellar 2014 1080p BluRay", "Interstellar 2014 2160p UHD" for movie searches).
    - Varied sizes (700MB to 15GB).
    - Varied ages (1 hour to 30 days).
    - Multiple fake indexers (e.g., "DemoIndexer1", "DemoIndexer2", "DemoIndexer3").
    - Categories matching the search category.
    - Some results with duplicate hashes (to demonstrate grouping).
    - For movie searches: quality ratings and cover image URLs.
    - Mix of NZB and optionally torrent results.
3. Includes realistic `IndexerSearchMetaData` for 3 fake indexers.
4. Includes some sample rejection reasons.

**Integration point:** In `SearchWeb.search()`, check the demo mode flag before calling `searcher.search()`. If demo mode is active, call `demoDataProvider.generateSearchResponse(parameters)` instead.

#### 3.3.4 Mock Autocomplete Results

When demo mode is active and the user (or tour) types a movie name:

- `GET /internalapi/autocomplete/MOVIE?input=interstellar` returns a hardcoded list of movies:
  ```json
  [
    {"title": "Interstellar", "year": 2014, "tmdbId": "157336", "imdbId": "tt0816692", "posterUrl": null},
    {"title": "Interstellar Wars", "year": 2016, "tmdbId": "383427", "imdbId": "tt5083670", "posterUrl": null},
    {"title": "Interstellar: Nolan's Odyssey", "year": 2014, "tmdbId": "518999", "posterUrl": null}
  ]
  ```

**Note:** `posterUrl` can be `null` during demo mode (no external image fetching). Alternatively, use placeholder images bundled with the app.

**Integration point:** In `MediaInfoWeb.autocomplete()`, check the demo mode flag. If active, return hardcoded results from `DemoDataProvider`.

#### 3.3.5 Mock Downloader

When demo mode is active:

- The "send to downloader" endpoint (`PUT /internalapi/downloader/addNzbs`) returns a successful `AddNzbsResponse` without contacting any real downloader.
- The frontend should show a mock downloader called **"Demo Downloader"** in the download buttons, even if no real downloader is configured.
- `GET /internalapi/downloader/{name}/categories` returns a few mock categories (e.g., "Movies", "TV", "Default").

**Integration point:**

- In `DownloaderWeb.addNzb()`, check the demo mode flag. If active, return a mock success response.
- The frontend `ConfigService` or `NzbDownloadService` should inject a fake downloader entry when demo mode is active.

#### 3.3.6 Mock Search Progress (WebSocket)

The search progress modal uses WebSocket (SockJS/STOMP) to show real-time indexer progress. During demo mode:

- The backend should send mock WebSocket messages simulating 3 fake indexers completing their searches over ~2 seconds.
- This makes the progress modal feel realistic.

**Integration point:** In `SearchWeb.search()` (or the demo search handler), send mock `SearchState` updates via `SimpMessagingTemplate` before returning the mock results.

### 3.4 File Changes Summary

#### New Files

| File                                                              | Purpose                                                                            |
|-------------------------------------------------------------------|------------------------------------------------------------------------------------|
| `core/ui-src/js/guided-tour-service.js`                           | AngularJS service managing tour lifecycle, step definitions, and automated actions |
| `core/src/main/java/org/nzbhydra/searching/DemoDataProvider.java` | Generates mock search results, autocomplete data, and download responses           |
| `core/src/main/java/org/nzbhydra/searching/DemoModeWeb.java`      | REST controller for activating/deactivating demo mode                              |

#### Modified Files

| File                                                                         | Change                                                                                       |
|------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| `core/bower.json`                                                            | Add `angular-ui-tour` dependency                                                             |
| `core/ui-src/js/nzbhydra.js`                                                 | Add `'bm.uiTour'` module dependency                                                          |
| `core/gulpfile.js`                                                           | Include `angular-ui-tour` JS/CSS in the build                                                |
| `core/ui-src/html/states/search.html`                                        | Add the "Take a Tour" button and `tour-step` attributes on key elements                      |
| `core/ui-src/html/states/search-results.html`                                | Add `tour-step` attributes on results table, column headers, filter inputs, download buttons |
| `core/ui-src/html/directives/search-result.html`                             | Add `tour-step` attributes on checkboxes, download icons                                     |
| `core/ui-src/js/search-controller.js`                                        | Minor additions to support tour's automated actions (expose methods for the tour service)    |
| `core/ui-src/js/search-results-controller.js`                                | Minor additions for tour step registration on dynamic elements                               |
| `core/src/main/java/org/nzbhydra/searching/SearchWeb.java`                   | Check demo mode flag, route to `DemoDataProvider` if active                                  |
| `core/src/main/java/org/nzbhydra/mediainfo/MediaInfoWeb.java`                | Check demo mode flag, return mock autocomplete data if active                                |
| `core/src/main/java/org/nzbhydra/downloading/downloaders/DownloaderWeb.java` | Check demo mode flag, return mock download success if active                                 |

---

## 4. Detailed Technical Design

### 4.1 Demo Mode Flag

```java
// DemoModeWeb.java
@RestController
public class DemoModeWeb {

    private static boolean demoModeActive = false;

    @PutMapping("/internalapi/demomode")
    @Secured("ROLE_USER")
    public void activateDemoMode() {
        demoModeActive = true;
    }

    @DeleteMapping("/internalapi/demomode")
    @Secured("ROLE_USER")
    public void deactivateDemoMode() {
        demoModeActive = false;
    }

    public static boolean isDemoModeActive() {
        return demoModeActive;
    }
}
```

### 4.2 DemoDataProvider (Sketch)

```java

@Component
public class DemoDataProvider {

    public SearchResponse generateSearchResponse(SearchRequestParameters params) {
        // Generate 30 realistic SearchResultWebTO items
        // Titles based on params.getQuery() or params.getTitle()
        // Varied sizes, ages, indexers, categories
        // Some duplicates (same hash) for grouping demo
        // Realistic IndexerSearchMetaData for 3 fake indexers
    }

    public List<MediaInfoTO> generateAutocompleteResults(String input, AutocompleteType type) {
        // Return hardcoded movie/TV suggestions matching the input
    }

    public AddNzbsResponse generateDownloadResponse(AddFilesRequest request) {
        // Return successful response with all requested IDs as "added"
    }
}
```

### 4.3 SearchWeb Integration

```java
// In SearchWeb.search():
@PostMapping("/internalapi/search")
public SearchResponse search(@RequestBody SearchRequestParameters parameters) {
    if (DemoModeWeb.isDemoModeActive()) {
        // Send mock WebSocket progress updates
        sendMockSearchProgress(parameters.getSearchRequestId());
        return demoDataProvider.generateSearchResponse(parameters);
    }
    // ... existing search logic ...
}
```

### 4.4 Frontend Tour Service (Sketch)

```javascript
// guided-tour-service.js
angular.module('nzbhydraApp').factory('GuidedTourService',
    function ($http, $timeout, $rootScope, uiTourService) {

        var service = {};
        var demoModeActive = false;

        service.startTour = function () {
            // 1. Activate demo mode on backend
            $http.put('internalapi/demomode').then(function () {
                demoModeActive = true;
                // 2. Inject fake downloader into config
                injectFakeDownloader();
                // 3. Start the tour
                var tour = uiTourService.getTour();
                tour.start();
            });
        };

        service.endTour = function () {
            // 1. Deactivate demo mode
            $http.delete('internalapi/demomode').then(function () {
                demoModeActive = false;
                // 2. Remove fake downloader
                removeFakeDownloader();
                // 3. Clear search results, reset category
                $rootScope.$broadcast('tourEnded');
            });
        };

        // Automated actions
        service.typeIntoField = function (elementId, text, delayPerChar) {
            // Animate typing character by character using $timeout
        };

        service.clickElement = function (selector) {
            // Programmatically trigger a click via angular.element
        };

        return service;
    });
```

### 4.5 angular-ui-tour Step Configuration

Steps are defined either declaratively in HTML:

```html
<input id="searchfield"
       tour-step="searchField"
       tour-step-title="Search Query"
       tour-step-content="Type your search terms here."
       tour-step-order="4"
       tour-step-placement="bottom">
```

Or programmatically in the controller:

```javascript
var tour = uiTourService.createTour({
    name: 'guidedTour',
    backdrop: true,
    backdropPadding: 5,
    useUiRouter: true,
    onEnd: function () {
        GuidedTourService.endTour();
    }
});

tour.createStep({
    selector: '#searchfield',
    title: 'Search Query',
    content: 'Type your search terms here. We\'ll search for "linux" as an example.',
    order: 4,
    placement: 'bottom',
    onNext: function () {
        return GuidedTourService.typeIntoField('#searchfield', 'linux', 50);
    }
});
```

The programmatic approach is recommended since many steps need custom lifecycle hooks.

### 4.6 Cross-View Tour (Search → Results)

The tour starts on the search page (`root.search` state) and must continue after navigating to the results view (`root.search.results` state). `angular-ui-tour` supports this via `tour.waitFor(stepId)`:

1. Steps 1-7 are on the search page.
2. Step 7's `onNext` triggers the search and navigates to results.
3. Step 8 is defined in the `SearchResultsController` and registered with `tour.waitFor('resultsTable')`.
4. When the results view loads and the `resultsTable` step is registered, the tour automatically continues.

### 4.7 Fake Downloader Injection

When demo mode is active, the frontend needs to show download buttons even if no real downloader is configured. The `GuidedTourService` temporarily injects a fake downloader into `ConfigService`:

```javascript
function injectFakeDownloader() {
    var config = ConfigService.getSafe();
    if (!config.downloading || config.downloading.downloaders.length === 0) {
        config.downloading = config.downloading || {};
        config.downloading.downloaders = config.downloading.downloaders || [];
        config.downloading.downloaders.push({
            name: 'Demo Downloader',
            enabled: true,
            downloaderType: 'SABNZBD',
            // other required fields with dummy values
        });
        fakeDownloaderInjected = true;
    }
}
```

---

## 5. Edge Cases & Safety

### 5.1 Concurrent Users

NZBHydra2 is typically single-user. The static `demoModeActive` flag is acceptable. If multi-user support is needed later, switch to a session-scoped attribute or request header.

### 5.2 Demo Mode Cleanup

If the user closes the browser tab during the tour, demo mode stays active. Mitigations:

- Add a **timeout**: demo mode auto-deactivates after 10 minutes.
- Add a **check on page load**: if demo mode is active when the search page loads (and no tour is running), deactivate it.
- The backend could check `demoModeActive` on each normal search and log a warning.

### 5.3 No Indexers Configured

The tour should work even when no indexers are configured (common for new installations). The demo mode bypasses all indexer logic, so this is handled naturally.

### 5.4 Auth / Permissions

The tour button and demo mode endpoints require `ROLE_USER` (same as search). No additional permissions needed.

### 5.5 Mobile / Small Screens

`angular-ui-tour` repositions popovers based on viewport. Bootstrap 3 popovers handle this reasonably well. However, the tour is primarily designed for desktop use. On very small screens, some steps may need adjusted placement or content.

---

## 6. Mock Data Specification

### 6.1 Mock Search Results for "linux" (All category)

Generate ~30 results across 3 fake indexers with these characteristics:

| #   | Title                            | Indexer      | Size   | Age | Category |
|-----|----------------------------------|--------------|--------|-----|----------|
| 1   | Linux Mint 21.3 Cinnamon x64 ISO | DemoIndexer1 | 2.8 GB | 2d  | PC       |
| 2   | Ubuntu 24.04.1 LTS Desktop amd64 | DemoIndexer2 | 4.1 GB | 5d  | PC       |
| 3   | Arch Linux 2024.12.01 x86_64     | DemoIndexer1 | 850 MB | 1d  | PC       |
| 4   | Linux Mint 21.3 Cinnamon x64 ISO | DemoIndexer3 | 2.8 GB | 2d  | PC       |
| ... | (more varied results)            | ...          | ...    | ... | ...      |

Items 1 and 4 should share the same duplicate hash to demonstrate grouping.

### 6.2 Mock Autocomplete for "Interstellar" (Movies category)

```json
[
  {
    "title": "Interstellar",
    "year": 2014,
    "tmdbId": "157336",
    "imdbId": "tt0816692"
  },
  {
    "title": "Interstellar Wars",
    "year": 2016,
    "tmdbId": "383427",
    "imdbId": "tt5083670"
  },
  {
    "title": "Interstellar: Beyond the Cosmos",
    "year": 2020,
    "tmdbId": "718999"
  }
]
```

### 6.3 Mock Movie Search Results for "Interstellar"

Generate ~25 results with movie-specific data:

- Quality ratings (e.g., 720, 1080, 2160)
- Quality source labels (BluRay, WEB-DL, HDTV)
- Cover image URL (can be null or a bundled placeholder)
- Movie-specific categories

### 6.4 Mock Downloader Response

```json
{
  "successful": true,
  "message": "Successfully added 3 NZBs to Demo Downloader",
  "addedIds": [
    1,
    2,
    3
  ],
  "missedIds": []
}
```

---

## 7. Existing Code Reference

Key files and their roles in the search flow (for implementation reference):

### Backend

| File                                                                                               | Role                                                                          |
|----------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------|
| `core/src/main/java/org/nzbhydra/searching/SearchWeb.java`                                         | Internal search REST controller (`POST /internalapi/search`)                  |
| `core/src/main/java/org/nzbhydra/searching/Searcher.java`                                          | Core search engine (parallel indexer calls, dedup, pagination)                |
| `core/src/main/java/org/nzbhydra/searching/InternalSearchResultProcessor.java`                     | Transforms internal results → `SearchResultWebTO`                             |
| `core/src/main/java/org/nzbhydra/mediainfo/MediaInfoWeb.java`                                      | Autocomplete endpoint (`GET /internalapi/autocomplete/{type}`)                |
| `core/src/main/java/org/nzbhydra/downloading/downloaders/DownloaderWeb.java`                       | Send-to-downloader endpoint (`PUT /internalapi/downloader/addNzbs`)           |
| `core/src/main/java/org/nzbhydra/api/MockSearch.java`                                              | Existing mock pattern (for external API mocking during Sonarr/Radarr config)  |
| `core/src/main/java/org/nzbhydra/api/ExternalApi.java`                                             | Shows how `inMockingMode` static flag intercepts search calls (lines 171-175) |
| `shared/mapping/src/main/java/org/nzbhydra/searching/dtoseventsenums/SearchResultWebTO.java`       | Result transfer object (all fields)                                           |
| `shared/mapping/src/main/java/org/nzbhydra/searching/SearchResponse.java`                          | Search response wrapper                                                       |
| `shared/mapping/src/main/java/org/nzbhydra/searching/dtoseventsenums/SearchRequestParameters.java` | Search request from frontend                                                  |
| `shared/mapping/src/main/java/org/nzbhydra/mapping/newznab/mock/NewznabMockBuilder.java`           | Reference for generating mock data (not directly used but informative)        |

### Frontend

| File                                                | Role                                                                             |
|-----------------------------------------------------|----------------------------------------------------------------------------------|
| `core/ui-src/js/search-controller.js`               | Search form controller (category selection, autocomplete, search initiation)     |
| `core/ui-src/js/search-results-controller.js`       | Results display controller (sorting, filtering, grouping, selection)             |
| `core/ui-src/js/search-service.js`                  | HTTP service for search calls                                                    |
| `core/ui-src/js/nzb-download-service.js`            | Download service (send NZBs to downloader)                                       |
| `core/ui-src/js/directives/search-result.js`        | Individual result directive (checkbox, shift-click, expand/collapse)             |
| `core/ui-src/js/directives/download-nzbs-button.js` | Bulk download button directive                                                   |
| `core/ui-src/js/directives/addable-nzb.js`          | Per-result download icon directive                                               |
| `core/ui-src/js/directives/selection-button.js`     | Select all / invert / deselect all                                               |
| `core/ui-src/js/categories-service.js`              | Category management service                                                      |
| `core/ui-src/js/directives/multiselect-dropdown.js` | Display options dropdown                                                         |
| `core/ui-src/html/states/search.html`               | Search page template (199 lines)                                                 |
| `core/ui-src/html/states/search-results.html`       | Results template (359 lines)                                                     |
| `core/ui-src/html/directives/search-result.html`    | Result row template (136 lines)                                                  |
| `core/ui-src/html/search-state.html`                | Search progress modal (42 lines)                                                 |
| `core/ui-src/js/nzbhydra.js`                        | App module definition and routing (states: `root.search`, `root.search.results`) |
| `core/bower.json`                                   | Frontend dependencies                                                            |
| `core/gulpfile.js`                                  | Build pipeline                                                                   |

---

## 8. Implementation Order

Suggested order of implementation:

1. **Install `angular-ui-tour`** – bower install, wire into gulp build, add module dependency.
2. **Backend demo mode flag** – `DemoModeWeb` controller with PUT/DELETE endpoints.
3. **`DemoDataProvider`** – mock search results, autocomplete data, download responses.
4. **Backend integration** – add demo mode checks in `SearchWeb`, `MediaInfoWeb`, `DownloaderWeb`.
5. **Mock WebSocket progress** – send fake search progress messages during demo search.
6. **Frontend `GuidedTourService`** – tour lifecycle management, automated actions (typing, clicking).
7. **Tour step definitions** – define all steps with content, placement, and lifecycle hooks.
8. **HTML modifications** – add tour button to search page, add `tour-step` attributes to key elements.
9. **Fake downloader injection** – inject mock downloader into config when demo mode is active.
10. **Cleanup & polish** – demo mode timeout, page-load cleanup, styling adjustments.
11. **Testing** – manual walkthrough of the full tour flow, edge cases.

---

## 9. Open Questions

1. **Poster images in autocomplete:** During demo mode, should we use bundled placeholder poster images, or is it acceptable to show autocomplete results without posters?
2. **Tour content tone:** Should the tour text be formal/technical or friendly/casual?
3. **Localization:** Should tour text be translatable, or is English-only acceptable?
4. **Additional features for later:** The requirements mention "more features may come later." The tour system should be designed so that new steps can be easily added (e.g., for stats page, history page, config page).
5. **Torrent results:** Should the demo data include torrent results to demonstrate torrent-specific features (seeders/peers), or stick to NZB-only?
