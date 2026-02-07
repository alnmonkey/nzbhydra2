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

**Library:** Adapted local copy of [`angular-ui-tour`](https://github.com/benmarch/angular-ui-tour) (based on v0.9.4)

**Why this library:**

- Built on `angular-bootstrap` (specifically `uib-popover`) which NZBHydra2 already uses – guarantees visual consistency.
- Promise-based lifecycle hooks (`onNext`, `onShow`, etc.) – essential for waiting on async operations like search results loading.
- `tour.waitFor(stepId)` – essential for cross-view tours (search page → results view).
- `createStep()` API – steps can be defined programmatically from controllers.
- Explicit `ui-router` integration via `useUiRouter` config.
- MIT license (compatible with the project's Apache-2.0 license).

**Local adaptation:** The original bower package uses ES2017 `async/await` internally but also uses AngularJS `$q` promises. Native `await` on `$q.resolve()` stalls because no digest cycle fires from native async context, causing tour
transitions to freeze (see §10.8 for full details). To fix this, the library source was copied and adapted into a single local file.

**Location:** `core/ui-src/js/angular-ui-tour.js` (~1126 lines)

**Key changes from upstream:**

- All `async/await` removed — every async method rewritten to use `$q.then()` chains
- `digest()` uses `$timeout(angular.noop, 0)` instead of `$q.resolve()` to guarantee a digest cycle fires
- `handleEvent()` wraps results with `$q.resolve(result)` for consistent promise handling
- `EventEmitter` replaced with inline `SimpleEventEmitter` (removes external dependency)
- Templates registered via `$templateCache` in a `.run()` block
- Tether and Hone accessed as globals (`window.Tether`, `window.Hone`)

**Transitive dependencies** (installed via bower as direct deps): `cfp-angular-hotkeys`, `hone`, `tether`, `angular-scroll`, `angular-bind-html-compile`.

**Integration:**

- Add `'bm.uiTour'` to the AngularJS module dependencies in `nzbhydra.js`.
- The local `angular-ui-tour.js` is included in the Gulp `scripts` task (bundled into `nzbhydra.js`).
- Tour CSS rules are in `core/ui-src/less/partials/miscellaneous.less`.

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
PUT    /internalapi/demomode        → activates demo mode for the current user
DELETE /internalapi/demomode        → deactivates demo mode for the current user
```

Demo mode is **per-user** so that one user taking the tour does not affect other concurrent users. The backend maintains a `Set<String>` of usernames currently in demo mode.

**How the current user is identified:**

- **Auth configured (`FORM` or `BASIC`):** The current user is identified via Spring Security's `Principal` (injected into controller methods). In service-layer code where `Principal` is not available, `SessionStorage.username` is used —
  this is a `ThreadLocal<String>` that the existing `Interceptor` populates from `request.getRemoteUser()` at the start of every request.

- **Auth not configured (`NONE`):** All requests arrive as the anonymous user `"AnonymousUser"` (set by `HydraAnonymousAuthenticationFilter`). In this case the set contains `"AnonymousUser"` and demo mode is effectively global — which is
  correct because without auth there is only one logical user session.

**Checking demo mode from anywhere in the request pipeline:** The static method `DemoModeWeb.isDemoModeActive()` reads `SessionStorage.username.get()` and checks membership in the set. Any controller or service in the request thread can
call it without needing a `Principal` parameter.

**Thread safety:** The set uses `ConcurrentHashMap.newKeySet()`. In practice the set will contain 0 or 1 entries.

#### 3.3.2 Demo Mode Endpoints to Mock

When demo mode is active, the following endpoints return mock data instead of performing real operations:

| Endpoint                                        | Mock Behavior                                                         |
|-------------------------------------------------|-----------------------------------------------------------------------|
| `POST /internalapi/search`                      | Returns realistic mock search results (see §3.3.3). No indexer calls. |
| `PUT /internalapi/downloader/addNzbs`           | Returns a mock success response. No downloader communication.         |
| `GET /internalapi/downloader/{name}/categories` | Returns mock downloader categories.                                   |

#### 3.3.3 Mock Search Results

The mock search endpoint should return realistic results. The existing `NewznabMockBuilder` in `shared/mapping` already generates rich mock Newznab XML items. However, the internal search flow uses `SearchResultWebTO` (the web transfer
object), not Newznab XML.

**Approach:** Create a new class `DemoDataProvider` (or similar) in the `core` module that:

1. Generates a `SearchResponse` with 20-50 `SearchResultWebTO` items.
2. Items have realistic data using **Usenet naming conventions** (dot-separated words, quality tags, group suffix):
   - Varied titles based on the search query (e.g., `Linux.Mint.21.3.Cinnamon.x64-LiNUX`, `Ubuntu.24.04.1.LTS.Desktop.amd64-LiNUX`, `Arch.Linux.2024.12.01.x86_64-LiNUX` for query "linux"; or `Interstellar.2014.1080p.BluRay.x264-SPARKS`,
     `Interstellar.2014.2160p.UHD.BluRay.x265-TERMINAL` for movie searches).
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

#### 3.3.4 Autocomplete (No Mocking Required)

During demo mode, autocomplete uses the **real TMDB/TVMaze APIs** — no mocking is needed. This is the correct approach because:

- **Stability:** Autocomplete errors are handled gracefully — the existing code returns an empty list on any failure, so the tour never breaks.
- **Speed:** Results are triple-cached (7-day Guava in-memory cache, Caffeine `@Cacheable`, and database). After the first call, subsequent requests are instant.
- **Real poster images:** Using real autocomplete means real poster URLs are returned, making the tour visually polished without bundling placeholder images.
- **Zero additional code:** No mock data, no demo mode check in `MediaInfoWeb`, no maintenance burden.

The tour step (§2.2, Phase 5, step 27) types "Interstellar" into the search field and the real TMDB API returns actual movie results with posters.

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
| `core/ui-src/js/angular-ui-tour.js`                               | Adapted local copy of angular-ui-tour (~1126 lines), replaces bower dist           |
| `core/ui-src/js/guided-tour-service.js`                           | AngularJS service managing tour lifecycle, step definitions, and automated actions |
| `core/src/main/java/org/nzbhydra/searching/DemoDataProvider.java` | Generates mock search results and download responses                               |
| `core/src/main/java/org/nzbhydra/searching/DemoModeWeb.java`      | REST controller for activating/deactivating demo mode                              |

#### Modified Files

| File                                                                         | Change                                                                                       |
|------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| `core/bower.json`                                                            | Removed `angular-ui-tour`, added its transitive deps as direct deps                          |
| `core/ui-src/js/nzbhydra.js`                                                 | Add `'bm.uiTour'` module dependency                                                          |
| `core/gulpfile.js`                                                           | Include transitive deps (tether, hone, etc.) in vendor-scripts build                         |
| `core/ui-src/html/states/search.html`                                        | Add the "Take a Tour" button and `tour-step` attributes on key elements                      |
| `core/ui-src/html/states/search-results.html`                                | Add `tour-step` attributes on results table, column headers, filter inputs, download buttons |
| `core/ui-src/html/directives/search-result.html`                             | Add `tour-step` attributes on checkboxes, download icons                                     |
| `core/ui-src/js/search-controller.js`                                        | Minor additions to support tour's automated actions (expose methods for the tour service)    |
| `core/ui-src/js/search-results-controller.js`                                | Minor additions for tour step registration on dynamic elements                               |
| `core/src/main/java/org/nzbhydra/searching/SearchWeb.java`                   | Check demo mode flag, route to `DemoDataProvider` if active                                  |
| `core/src/main/java/org/nzbhydra/downloading/downloaders/DownloaderWeb.java` | Check demo mode flag, return mock download success if active                                 |

---

## 4. Detailed Technical Design

### 4.1 Demo Mode Flag (Per-User)

```java
// DemoModeWeb.java
@RestController
public class DemoModeWeb {

   private static final Set<String> usersInDemoMode = ConcurrentHashMap.newKeySet();

    @PutMapping("/internalapi/demomode")
    @Secured("ROLE_USER")
    public void activateDemoMode(Principal principal) {
       String username = resolveUsername(principal);
       usersInDemoMode.add(username);
    }

    @DeleteMapping("/internalapi/demomode")
    @Secured("ROLE_USER")
    public void deactivateDemoMode(Principal principal) {
       String username = resolveUsername(principal);
       usersInDemoMode.remove(username);
    }

   /**
    * Check if the current request's user is in demo mode.
    * Can be called from any controller/service in the request thread
    * because SessionStorage.username is a ThreadLocal populated by the Interceptor.
    */
    public static boolean isDemoModeActive() {
       String username = SessionStorage.username.get();
       return username != null && usersInDemoMode.contains(username);
    }

   private String resolveUsername(Principal principal) {
      if (principal != null) {
         return principal.getName();
      }
      // Fallback: when auth is NONE, SessionStorage has "AnonymousUser"
      return SessionStorage.username.get();
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

Demo mode is per-user via a `Set<String>` of usernames (see §4.1). Each user's demo mode is independent — one user taking the tour does not affect other users' search/download operations. When auth is not configured (`NONE`), all requests
use `"AnonymousUser"`, making demo mode effectively global — which is correct since there is only one logical user session in that configuration.

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

| #   | Title                                  | Indexer      | Size   | Age | Category |
|-----|----------------------------------------|--------------|--------|-----|----------|
| 1   | Linux.Mint.21.3.Cinnamon.x64-LiNUX     | DemoIndexer1 | 2.8 GB | 2d  | PC       |
| 2   | Ubuntu.24.04.1.LTS.Desktop.amd64-LiNUX | DemoIndexer2 | 4.1 GB | 5d  | PC       |
| 3   | Arch.Linux.2024.12.01.x86_64-LiNUX     | DemoIndexer1 | 850 MB | 1d  | PC       |
| 4   | Linux.Mint.21.3.Cinnamon.x64-LiNUX     | DemoIndexer3 | 2.8 GB | 2d  | PC       |
| ... | (more varied results)                  | ...          | ...    | ... | ...      |

Items 1 and 4 should share the same duplicate hash to demonstrate grouping.

### 6.2 Autocomplete for "Interstellar" (Movies category)

**No mock data needed.** During demo mode, autocomplete hits the real TMDB API via `MediaInfoWeb.autocomplete()`. The existing triple-cached pipeline (Guava 7-day TTL, Caffeine `@Cacheable`, database) ensures fast responses. Errors return
an empty list gracefully, so the tour never breaks. Real poster URLs are returned, providing a polished visual experience without bundled placeholder images.

### 6.3 Mock Movie Search Results for "Interstellar"

Generate ~25 results with movie-specific data using Usenet naming conventions:

- Titles like `Interstellar.2014.1080p.BluRay.x264-SPARKS`, `Interstellar.2014.2160p.UHD.BluRay.x265-TERMINAL`, `Interstellar.2014.720p.WEB-DL.DD5.1.H.264-FGT`, `Interstellar.2014.HDTV.x264-LOL`
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
| `core/ui-src/js/angular-ui-tour.js`                 | Adapted local copy of angular-ui-tour (tour engine, directives, services)        |
| `core/ui-src/js/guided-tour-service.js`             | Tour service (step definitions, lifecycle, automated actions)                    |
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

| Step | Task                            | Status   | Notes                                                                                                                                                                                                                                                                                                                                                                                                         |
|------|---------------------------------|----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1    | Install `angular-ui-tour`       | **Done** | Adapted angular-ui-tour source into local file `core/ui-src/js/angular-ui-tour.js` (~1126 lines) with all `async/await` replaced by `$q.then()` chains (see §10.8). Added transitive deps (`cfp-angular-hotkeys`, `hone`, `tether`, `angular-scroll`, `angular-bind-html-compile`) as direct bower deps. Added `'bm.uiTour'` to module deps in `nzbhydra.js`. Rebuilt `alllibs.js` via `gulp vendor-scripts`. |
| 2    | Backend demo mode flag          | **Done** | `DemoModeWeb.java` created — `PUT`/`DELETE /internalapi/demomode`, per-user `Set<String>` via `ConcurrentHashMap.newKeySet()`, static `isDemoModeActive()` reads `SessionStorage.username`.                                                                                                                                                                                                                   |
| 3    | `DemoDataProvider`              | **Done** | `DemoDataProvider.java` created — generates 30 `SearchResultWebTO` items with Usenet naming, 3 fake indexers, duplicate hash groups for grouping demo, quality ratings for movies, rejection reasons map, mock download response, mock downloader categories. Fixed `Random(42)` seed.                                                                                                                        |
| 4    | Backend integration             | **Done** | `SearchWeb.search()` checks `DemoModeWeb.isDemoModeActive()` before real search; returns `demoDataProvider.generateSearchResponse()`. `DownloaderWeb.addNzb()` and `getCategories()` check demo mode and return mock responses.                                                                                                                                                                               |
| 5    | Mock WebSocket progress         | **Done** | `SearchWeb.sendMockSearchProgress()` sends mock `SearchState` updates via `SimpMessageSendingOperations`: initial state → indexer selection (3 indexers) → staggered indexer completion (500/700/900ms delays) → search finished.                                                                                                                                                                             |
| 6    | Frontend `GuidedTourService`    | **Done** | Tour lifecycle (start/end/isTourActive), automated action helpers (typeIntoField, clickElement, waitForElement, selectCategory, waitForResults, selectFirstCheckbox), fake downloader injection/removal. Includes duplicate step registration guard (`createStepIfNew`).                                                                                                                                      |
| 7    | Tour step definitions           | **Done** | All 35 steps across 7 phases defined programmatically via `createStepIfNew()` in `registerSearchSteps()` (Phase 1 + 5) and `registerResultsSteps()` (Phase 2-4 + 6-7). Cross-view transitions use `tour.waitFor()`.                                                                                                                                                                                           |
| 8    | HTML + Controller modifications | **Done** | `search.html`: added `ui-tour` directive wrapper, "Take a Tour" button, reactive tour-aware `ng-if`/`ng-show`. `search-controller.js`: injected `GuidedTourService`/`uiTourService`, added tour scope functions, bypassed indexer check in demo mode, added page-load cleanup. `search-results-controller.js`: injected `GuidedTourService`, added `registerResultsSteps()` call in `onFinishRender` handler. |
| 9    | Fake downloader injection       | **Done** | Integrated into `GuidedTourService` — `injectFakeDownloader()` on tour start, `removeFakeDownloader()` on tour end.                                                                                                                                                                                                                                                                                           |
| 10   | Cleanup & polish                | **Done** | Demo mode auto-deactivation timeout (10min) via `ScheduledExecutorService` in `DemoModeWeb`. Page-load cleanup in `SearchController` (fire-and-forget `DELETE /internalapi/demomode`). Tour backdrop + popover CSS in `miscellaneous.less`. Duplicate step guard in `GuidedTourService`. All builds pass (IntelliJ + Gulp scripts + Gulp LESS).                                                               |
| 11   | Testing                         | **Done** | Automated Playwright test (`test_tour.py`) passes all 7 phases end-to-end. Phase 4→5 `$digest` bug fixed (§10.4). Phase 5→6 transition validated (§10.7). All phase transitions working correctly.                                                                                                                                                                                                            |

---

## 9. Design Decisions (Resolved)

1. **Tour content tone:** Friendly and casual. Approachable language, not formal/technical.
2. **Localization:** English only. No translation infrastructure needed.
3. **Extensibility:** The tour system must be designed so that new steps and phases can be easily added later (e.g., for stats page, history page, config page). Step definitions should be modular and self-contained.
4. **Torrent results:** NZB-only. Demo data does not include torrent results.

---

## 10. Known Issues & Debugging Log

### 10.1 Phase 1→2 Transition Bug (FIXED)

**Status:** Fixed.

**Symptom:** When Phase 1 (Basic Search) completes and the tour triggers a search + navigates to `root.search.results`, the search results load correctly and the "Searching... please wait" modal closes, but the **tour popover does NOT
reappear** on the results page.

#### 10.1.1 Previously Fixed Issues

**Fix 1: `$stateParams.category` null crash (APPLIED, WORKING)**

In `search-results-controller.js`, two lines accessed `$stateParams.category.toLowerCase()` without null-checking. During demo mode, category can be undefined in the URL params.

- **Line 50** (was): `$stateParams.category.toLowerCase().indexOf("tv")`
  **Now**: `var categoryLower = ($stateParams.category || "").toLowerCase();` then uses `categoryLower`
- **Line 165** (was): `$stateParams.category.toLowerCase().indexOf("tv")`
  **Now**: uses `categoryLower`

This fix resolved the crash that prevented search results from rendering at all.

#### 10.1.2 Root Cause Analysis

**The `waitFor`/`resumeWhenFound` mechanism in angular-ui-tour** should theoretically work but fails due to a subtle async/digest-cycle mismatch between native JavaScript `async/await` (used internally by angular-ui-tour) and AngularJS's
`$q` promise system.

**Detailed execution flow:**

1. User clicks "Next" on `goButton` step → `tour.next()` → `tour.goTo('$next')`
2. `goTo` calls `await handleEvent(currentStep.config('onNext'))` — invokes our `goButton.onNext`
3. `goButton.onNext` calls `scope.initiateSearch()` (triggers search HTTP + `$state.go`) and returns `tour.waitFor('resultsTable')`
4. Inside `waitFor`:
    - Sets `resumeWhenFound` callback (synchronously, before any await)
    - Calls `await self.pause()` — hides goButton step, sets status PAUSED
    - Sets `tourStatus = TourStatus.WAITING`
    - Returns `$q.reject()` — halts the `goTo` chain
5. Search response arrives → `$state.go("root.search.results")` → `SearchResultsController` initializes
6. `onFinishRender` fires → `$timeout(..., 1)` → `registerResultsSteps()` → `clearResultsSteps()` + `createStepIfNew({stepId: 'resultsTable', ...})`
7. `tour.createStep()` → `tour.addStep(step)` — adds step, emits `'stepAdded'`, then calls `resumeWhenFound(step)`
8. `resumeWhenFound` checks `step.stepId === 'resultsTable'` → **MATCH** → calls `setCurrentStep(step)` then `self.resume()`
9. `self.resume()` is an `async` function → calls `self.showStep(getCurrentStep())`
10. `showStep` calls `await digest()` which returns `$q.resolve()` — **but this `$q` promise may never resolve within the native async context because no AngularJS digest cycle is triggered**

**The core problem:** angular-ui-tour's internal functions (`resume`, `showStep`, `hideStep`, `pause`) are all ES2017 `async` functions that use native `await`. However, they also use `$q.resolve()` / `$q.reject()` (AngularJS promises).
Native `await` on a `$q` promise does NOT trigger an AngularJS digest cycle. The promise resolves eventually only when something else triggers a digest. When `resumeWhenFound` is called synchronously from within `addStep`, the subsequent
`resume()` → `showStep()` chain runs in native async context, and the `await digest()` call inside `showStep` (which returns `$q.resolve()`) may stall because no `$scope.$apply()` or `$timeout` triggers a digest.

This is a known class of bug when mixing native Promises/async-await with AngularJS `$q`. See: https://www.bennadel.com/blog/3272-mixing-native-promises-and-q-promises-in-angularjs.htm

#### 10.1.3 The `pendingWaitForStepId` Mechanism

This is a **separate, backup mechanism** designed for the case where the `ui-tour` directive IS destroyed and recreated (new tour instance) during a state transition. In that scenario:

- `pendingWaitForStepId` is set before the transition
- After recreation, `onTourReady` fires → `registerSearchSteps(newTour)` is called
- At the bottom of `registerSearchSteps()`, if `pendingWaitForStepId` is set, it sets up a `tour.on('stepAdded', ...)` listener and clears `pendingWaitForStepId`
- When `registerResultsSteps()` later adds the step, the listener catches it and calls `tour.startAt(step)`

In the current scenario (parent view `root.search` stays alive, so the `ui-tour` directive is NOT destroyed), `pendingWaitForStepId` is set but `registerSearchSteps()` is NOT called again, so it sits unused. The `waitFor`/`resumeWhenFound`
mechanism on the existing tour instance is what should handle this case — but it fails due to the async/digest issue above.

#### 10.1.4 Applied Fix (Pragmatic Fallback)

Instead of trying to fix angular-ui-tour's async/`$q` internals, a **manual fallback** was added at the end of `registerResultsSteps()`. After creating all steps, a `$timeout` (which triggers a digest cycle) checks if the tour is stuck in
WAITING/PAUSED state and manually starts it at the target step:

```javascript
// At the end of registerResultsSteps(), after all createStepIfNew calls:
$timeout(function () {
    var status = tour.getStatus();
    if (status === tour.Status.WAITING || status === tour.Status.PAUSED) {
        console.log('[TOUR] Tour stuck in waiting/paused, manually starting at resultsTable');
        tour.startAt('resultsTable');
    }
}, 200);
```

**Why `startAt` instead of `resume`:** `startAt` does its own `setCurrentStep(step)` + `showStep(step)` and runs inside a `$timeout` callback (which is inside a digest cycle), avoiding the native-async/`$q` mismatch. `resume()` would
require `getCurrentStep()` to already be correctly set and still suffers from the same async issue.

**Why `$timeout` with 200ms:** Gives `clearResultsSteps()` + `createStepIfNew()` time to complete all step registrations and ensures we're in a clean digest cycle.

This same pattern applies to the Phase 4→5 (`bulkDownloadDone` → `movieSearchIntro`) and Phase 5→6 (`movieGoButton` → `displayOptions`) transitions.

#### 10.1.5 angular-ui-tour Internal Architecture Reference

The adapted local copy lives at `core/ui-src/js/angular-ui-tour.js`. Key internal structures (all in a single file):

| Section / Function  | Key Functions                                                                                                                                                         |
|---------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Tour controller     | `waitFor(stepId)`, `addStep(step)`, `createStep(options)`, `goTo('$next')`, `pause()`, `resume()`, `showStep(step)`, `hideStep(step)`, `startAt(stepOrStepIdOrIndex)` |
| Step service        | `createStep(options, tour)` — builds step object; `showStep(step, tour)` — resolves selector to DOM element, creates popup + Tether positioning                       |
| `ui-tour` directive | Link function — calls `ctrl.init(tour)` which registers tour with `uiTourService`                                                                                     |
| `uiTourService`     | `getTour()` returns `tours[0]`, `_registerTour`/`_unregisterTour` manage the array                                                                                    |

**TourStatus enum:** `OFF=0, ON=1, PAUSED=2, WAITING=3` (defined in `angular-ui-tour.js`)

**Navigation interceptors are DISABLED by default.** `enableNavigationInterceptors()` must be explicitly called to activate the `$stateChangeStart` listener that would call `endAllTours()`. We don't call it, so state transitions do NOT kill
the tour.

### 10.2 Playwright Test (`test_tour.py`)

A comprehensive Playwright test exists at the project root for automated tour testing:

- **Diagnostics:** Tour identity tagging (`__tourId`), 50ms status polling, `_registerTour`/`_unregisterTour` monkey-patches, event listeners
- **Test functions:** `test_phase1` through `test_phase7`
- **Run command:** `python test_tour.py --headed` (from project root)
- **Cache busting:** URL rewriting for `.js` files to avoid stale cached scripts

### 10.3 Build Environment Note

**Maven cannot compile `core` module from command line** due to a pre-existing Lombok annotation processing issue (`SearchResultWebTOBuilder` not found in `InternalSearchResultProcessor.java`). The `mapping` module uses
`@Builder @Jacksonized` on `SearchResultWebTO` and the generated builder class isn't visible to Maven's cross-module compilation. **IntelliJ handles this correctly via its Lombok plugin.** All LSP errors about "cannot resolve" types from
the `mapping` module are this same pre-existing issue — they are NOT errors in our code.

### 10.4 Phase 4→5 Transition Bug (FIXED)

**Symptom:** When "Next" is clicked on the `bulkDownloadDone` step, the `onNext` handler navigates to `root.search` and schedules `tour.startAt('movieSearchIntro')` via `$timeout(fn, 300)`. The `startAt` call triggers
`movieSearchIntro.onShow`, which calls `scope.$apply()` — but since `startAt` runs inside a `$timeout` callback (already inside a digest cycle), this throws `Error: [$rootScope:inprog] $digest already in progress`.

The `$digest` error caused `onShow` to fail, which prevented the `movieSearchIntro` popover from rendering. The popover remained stuck on "Bulk Download Done!".

**Fix applied:** In `movieSearchIntro.onShow`, replaced the direct `scope.$apply()` with a `$timeout` wrapper:

```javascript
// Before (broken):
scope.query = '';
scope.selectedItem = null;
scope.$apply();

// After (fixed):
$timeout(function () {
    scope.query = '';
    scope.selectedItem = null;
});
```

`$timeout` automatically triggers a digest cycle after its callback runs, so the scope changes are properly propagated without risking a nested digest.

### 10.5 clearResultsSteps() Crash Fix (FIXED)

**Symptom:** `clearResultsSteps()` crashed with `TypeError: Cannot read properties of undefined (reading 'length')` when calling `tour._getSteps()`.

**Fix applied:** Inlined the step ID array directly in `clearResultsSteps()` (instead of referencing a separate variable), added `typeof tour._getSteps === 'function'` guards, and wrapped step removal in try/catch. The same defensive
pattern was applied to `createStepIfNew()`.

### 10.6 Phase Transition Summary

| Transition                   | Mechanism                                                                                                  | Status    |
|------------------------------|------------------------------------------------------------------------------------------------------------|-----------|
| Phase 1→2 (search → results) | `tour.waitFor('resultsTable')` + `$timeout` fallback in `registerResultsSteps()`                           | **Fixed** |
| Phase 4→5 (results → search) | `$state.go('root.search')` + `$timeout(tour.startAt('movieSearchIntro'), 300)`                             | **Fixed** |
| Phase 5→6 (search → results) | `tour.waitFor('displayOptions')` + `clearResultsSteps()` + `$timeout` fallback in `registerResultsSteps()` | **Fixed** |

### 10.7 Phase 4→5 Transition `tour.pause()` Fix (FIXED)

**Symptom:** When "Next" is clicked on `bulkDownloadDone`, the old popover remained visible while the tour navigated back to the search form. The `goTo('$next')` chain calls `handleEvent(onNext)` then `.then(hideStep)` — if `onNext` returns
`$q.reject()`, `hideStep` is skipped, leaving the old popover stuck on screen.

**Root cause:** The original `bulkDownloadDone.onNext` returned `$q.reject()` immediately (to prevent `goTo` from advancing to the next step). But because the rejection skips the `.then(hideStep)` in the chain, the `bulkDownloadDone`
popover was never hidden.

**Fix applied:** Call `tour.pause()` first (which internally hides the current step and backdrop), then schedule the `startAt('movieSearchIntro')` call, then return `$q.reject()`:

```javascript
onNext: function () {
    $state.go('root.search', {}, {inherit: true, notify: true, reload: false});
    pendingWaitForStepId = 'movieSearchIntro';
    return tour.pause().then(function () {
        $timeout(function () {
            if (tour && tour.hasStep('movieSearchIntro')) {
                pendingWaitForStepId = null;
                tour.startAt('movieSearchIntro');
            }
        }, 300);
        return $q.reject();
    });
}
```

### 10.8 Replaced angular-ui-tour Bower Package with Adapted Local Copy (FIXED)

**Symptom:** Multiple phase transitions failed because angular-ui-tour's internal `async/await` functions stall when awaiting `$q` promises. Native `await` on `$q.resolve()` does not trigger an AngularJS digest cycle, causing the tour to
freeze.

**Root cause:** angular-ui-tour v0.9.4 uses ES2017 `async/await` internally but returns `$q` promises. When `resumeWhenFound` calls `resume()` (an async function) which calls `showStep()` which does `await digest()` (returning
`$q.resolve()`), the native `await` never resolves because no digest cycle fires from native async context.

**Fix applied:** Removed `angular-ui-tour` from `bower.json` and created a local adapted copy at `core/ui-src/js/angular-ui-tour.js` (~1126 lines) with these changes:

- All `async/await` removed — every async method rewritten to use `$q.then()` chains
- `digest()` uses `$timeout(angular.noop, 0)` instead of `$q.resolve()` to guarantee a digest cycle fires
- `handleEvent()` wraps results with `$q.resolve(result)` for consistent promise handling
- `EventEmitter` replaced with inline `SimpleEventEmitter` (removes external dependency)
- Templates registered via `$templateCache` in a `.run()` block
- Tether and Hone accessed as globals (`window.Tether`, `window.Hone`)
- Added transitive dependencies (`cfp-angular-hotkeys`, `hone`, `tether`, `angular-scroll`, `angular-bind-html-compile`) as direct bower deps

### 10.9 Tour CSS Added to miscellaneous.less (DONE)

Added `.no-scrolling`, `.ui-tour-popup:focus`, `.ui-tour-popup-orphan`, and arrow positioning rules to `core/ui-src/less/partials/miscellaneous.less` to ensure proper tour popover styling and positioning.

### 10.10 Tour Reset Bug — `onFinishRender` Re-registration Race (FIXED)

**Symptom:** The tour intermittently reset to "Welcome to the Tour!" while the user was on the results page — not during state transitions, but during normal interaction (sorting, filtering, or any action that caused the results table to
re-render).

**Root cause:** The `onFinishRender` directive (`core/ui-src/js/directives/on-finish-render.js`) fires `scope.$emit("onFinishRender")` whenever `scope.$last === true` in an `ng-repeat`. This fires on **every** re-render of the results
table (sorting by column, typing in the title filter, etc.), not just the initial render.

Each time `onFinishRender` fired, `SearchResultsController` called `registerResultsSteps()` in the tour service. This function called `clearResultsSteps()` first, which removed ALL result step objects from the tour's internal `stepList`
array via `tour.removeStep()` — including the **currently displayed step**.

When the user then clicked "Next", the `getStepByOffset(+1)` function in `angular-ui-tour.js` (line ~622-627) executed:

```javascript
stepList[stepList.indexOf(getCurrentStep()) + offset]
```

Since the current step object had been removed from the array, `indexOf(currentStep)` returned `-1`. Then `-1 + 1 = 0`, so `stepList[0]` was returned — which was the `welcome` step (order 10, the lowest-order step). The tour jumped back
to "Welcome to the Tour!".

**Fix applied** (in `guided-tour-service.js`, at the top of `registerResultsSteps()`):

```javascript
if (registeredStepIds['resultsTable'] && tourStatus === tour.Status.ON) {
    console.log('[TOUR] registerResultsSteps() - results steps already registered and tour is ON, skipping re-registration');
    return;
}
```

This guard checks two conditions:

1. Results steps are already registered (`registeredStepIds['resultsTable']` is truthy)
2. The tour status is ON (status 1, meaning actively showing steps)

If both are true, re-registration is skipped entirely. This allows re-registration only when:

- The tour is WAITING or PAUSED (status 2 or 3) — the Phase 5→6 transition where we legitimately need to clear and recreate steps after a new search
- Steps haven't been created yet (first visit to results)

**Verification:** The fix was verified with a `--debug-reset` stress test mode added to the Playwright test. This mode deliberately triggers re-renders (clicking sort headers, typing in the title filter) between every tour step on the
results page. Health checks confirm `currentStepInList` is always a valid index, never `-1`.

### 10.11 Bug: Welcome step does not explain interaction model (OPEN)

**Symptom:** Users are confused about when they need to interact with the UI vs when the tour will do things automatically. For example, on the "Let's hit Go!" step, users think they should click the Go button themselves, but the tour
clicks it automatically.

**Root cause:** The welcome step does not explain the two modes of interaction (automated actions vs user actions), and there is no visual distinction in the step content between instructions that mean "watch the tour do this" vs "you need
to do this yourself".

**Fix plan:**

1. Update the welcome step content to explain the interaction model: some steps are automated (the tour does it for you) and some require user action.
2. Use a distinct visual format for user-action instructions vs informational/automated steps — e.g. a styled callout or icon for "Your turn!" prompts.

### 10.12 Bug: Download icon shows error cross instead of green checkmark (OPEN)

**Symptom:** After the tour auto-clicks the download icon and the toast message says "Successfully added 1 NZB to Demo Downloader", the download icon shows a red error cross instead of a green checkmark.

**Root cause:** Type mismatch between `searchResultId` and `addedIds` in demo mode. The success check in `addable-nzb.js` (line 42) does:

```javascript
response.data.addedIds.indexOf(Number($scope.searchresult.searchResultId)) > -1
```

Demo results have `searchResultId = "DEMO-RESULT-0"`, `"DEMO-RESULT-1"`, etc. (strings). `Number("DEMO-RESULT-0")` evaluates to `NaN`. The mock `DemoDataProvider.generateDownloadResponse()` returns `addedIds = [1, 2, 3, ...]` (sequential
longs). `indexOf(NaN)` always returns `-1`, so the check fails and the icon shows the error state.

**Fix plan:** In `DemoDataProvider.generateDownloadResponse()`, parse the actual `searchResultId` values from the request and include them in `addedIds`. Since `addedIds` is `Collection<Long>` and demo IDs are strings like
`"DEMO-RESULT-0"`, an alternative approach is to change the demo `searchResultId` values to numeric strings (e.g. `"10001"`, `"10002"`, etc.) so that `Number()` conversion works, and return matching longs in `addedIds`.

### 10.13 Bug: Search bar shows [object Object] after selecting autocomplete result (OPEN)

**Symptom:** After "Interstellar" is typed into the search bar and the user selects an autocomplete result, the search field displays `[object Object]` instead of being cleared.

**Root cause:** The `uib-typeahead` directive on the search field is configured as:

```html
uib-typeahead="item as item.label for item in getAutocomplete($viewValue)"
```

The `item as item.label` syntax means the typeahead uses `item.label` as the display text but binds the full `item` object to the model (`$scope.query`). When the tour's `onNext` handler in the `autocompleteDropdown` step triggers a click
on the typeahead match, the full autocomplete item object gets set as `$scope.query`. Since `$scope.query` is displayed in the search field, it renders as `[object Object]`.

The normal flow handles this in `selectAutocompleteItem($item)` (which is bound via `typeahead-on-select`): it sets `$scope.selectedItem = $item` and `$scope.query = ""`. However, when the tour programmatically triggers the click, the
typeahead may set the model value to the object before `selectAutocompleteItem` clears it, or `selectAutocompleteItem` may not fire at all via `triggerHandler('click')`.

**Fix plan:** In the `autocompleteDropdown.onNext` handler, after triggering the click, explicitly clear `$scope.query` and set `$scope.selectedItem` from the autocomplete data. Or, in the `movieSelected.onShow` handler, clear the search
field model value to empty string.

### 10.14 Bug: Tour popovers render partially outside browser viewport (OPEN)

**Symptom:** Several tour popovers are shown halfway outside the browser window. The affected steps include those related to autocomplete (`autocompleteDropdown`, `movieSelected`), and others near the edges of the viewport. The popovers
with messages like "The search will now use" and "Each shows the movie" are cut off.

**Root cause:** The `positionPopup()` function in `angular-ui-tour.js` (lines 497-513) creates a Tether instance without any `constraints` configuration:

```javascript
step.tether = new Tether({
    element: step.popup[0],
    target: step.element[0],
    attachment: positionMap[step.config('placement')].popup,
    targetAttachment: positionMap[step.config('placement')].target
    // NO constraints property!
});
```

Without Tether constraints, popovers are positioned exactly at the attachment points regardless of whether they overflow the viewport. Tether supports a `constraints` option with `to: 'window'` and `attachment: 'together'` that would
automatically flip the popover to the opposite side when it would overflow, and `pin: true` to clamp it to the viewport edge.

**Fix plan:** Add Tether constraints to the `positionPopup()` function:

```javascript
constraints: [{to: 'window', attachment: 'together', pin: true}]
```

This makes Tether automatically flip and pin popovers within the viewport bounds.

### 10.15 Bug: "Go!" and "Search for the Movie" popovers extend off-screen right on Firefox (FIXED)

**Symptom:** The `goButton` and `movieGoButton` popovers (both targeting `#startsearch` with `placement: 'bottom'`) extend partially outside the right edge of the browser viewport on Firefox. Other popovers that were previously off-screen
have been fixed by the Tether `constraints` addition (§10.14).

**Root cause:** Tether's `together` constraint flips the popover vertically (top↔bottom) but doesn't adjust the horizontal position when the target element is near the right edge. The `#startsearch` button is near the right side of the
form, and the popover (which is wider than the button) overflows rightward.

**Fix:** Change the `placement` of `goButton` and `movieGoButton` from `'bottom'` to `'left'` so the popover opens to the left of the button, avoiding the right edge. This is consistent with the button's position in the form layout.

### 10.16 Bug: Tour backdrop overlay doesn't cover full page after scrolling (FIXED)

**Symptom:** Starting from the "Filtering by Title" step, the dark backdrop overlay only covers part of the page. When the tour scrolls the page (e.g., moving from sorting steps to filter steps), the backdrop's overlay rectangles don't
extend to the bottom of the document. For the "Quick Filter Buttons" step, the backdrop only reaches the table header area, leaving the entire results table un-overlaid.

**Root cause:** Two issues:

1. Hone doesn't reposition the backdrop when the page scrolls during tour transitions.
2. Even when repositioned, Hone's BOTTOM backdrop element height calculation uses `viewportHeight` (`window.innerHeight`) rather than the full document scroll height. In `BackdropSide.js` line 39 (BOTTOM case), it computes:
   `height = Math.max(bodyHeight - targetBottom, viewportHeight - targetBottom)` — when the document is taller than the viewport (i.e., the page is scrollable), this produces a height that's too short, leaving the lower portion of the page
   uncovered.

**Fix (two parts):**

1. **Scroll listener:** After showing each step, call `uiTourBackdrop.reposition()` to force Hone to recalculate the backdrop dimensions. A `scroll` event listener is added while a backdrop step is active that calls `reposition()` to keep
   the backdrop covering the full page.
2. **Bottom height correction:** A `fixBottomBackdropHeight()` function in the `uiTourBackdrop` service (`angular-ui-tour.js`) runs after every `hone.position()` call. It finds the `.ui-tour-backdrop-component-bottom` element, reads its
   `top` style, computes `neededHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - top`, and if that exceeds what Hone calculated, overrides the element's height. This ensures the BOTTOM backdrop always
   extends to the full document height.

### 10.17 Bug: "Shift+Click for Range" and "Try Shift+Click" should be merged (FIXED)

**Symptom:** The "Shift+Click for Range" step (shiftClickExplain) just explains the concept, then the next step ("Try Shift+Click") asks the user to do it. Two steps for one action is unnecessary — the explanation and the action prompt
should be in a single step.

**Fix:** Merge the two steps into one. Remove the `shiftClickExplain` step and update `tryShiftClick` to include the explanation content + the user-action callout. Update `clearResultsSteps()` to remove the merged step ID.

### 10.18 Bug: "Select one to search by its database ID" should use user-action formatting (FIXED)

**Symptom:** In the `autocompleteDropdown` step, the text "Select one to search by its database ID." reads like a user action instruction but doesn't use the `tour-user-action` callout styling. This is inconsistent with other user-action
steps.

**Note:** The autocomplete selection is actually done automatically by the tour (the `onNext` handler clicks the first item). So this is NOT a user-action step. The text should be reworded to clarify that the tour will select one
automatically, not that the user should do it.

**Fix:** Reword the content to remove the imperative "Select one..." and instead say something like "The tour will automatically select the first result for you."

### 10.19 Bug: "Opening Display Options" dropdown doesn't actually open and popover covers it (FIXED)

**Symptom:** The "Opening Display Options" step says "The dropdown is now open" but the dropdown never actually opens. Even if it did, the tour popover would cover it since both use `placement: 'bottom'` on the same `#display-options`
element.

**Root cause:** The `onShow` handler triggers `angular.element(btn).triggerHandler('click')` on `#display-options .btn`, but the multiselect dropdown's `toggleDropdown()` function is bound via `ng-click` on a wrapping `<div>`, not the
button itself. The `triggerHandler('click')` on the button may not propagate to the `ng-click` handler on the parent div. Additionally, even if the dropdown opened, the popover at `placement: 'bottom'` would overlap it.

**Fix:** Restructure the display options steps:

1. The `displayOptions` step explains the button and tells the user the tour will open it.
2. In `displayOptions.onNext`, programmatically set `scope.open = true` on the multiselect-dropdown's scope.
3. The `displayOptionsOpen` step should use `placement: 'left'` or `placement: 'right'` so it doesn't overlap the dropdown.
4. The `displayOptionsHighlight` and `tryDisplayOptions` steps should also not cover the dropdown.

### 10.20 Bug: Enter key should advance tour + explain in welcome step (FIXED)

**Symptom:** Users must click the "Next" button with the mouse for every step. It would be more convenient to support pressing Enter to advance. This should be explained in the welcome step.

**Fix:** Add a `keydown` event listener on `document` when the tour is active that listens for the Enter key and calls `tour.next()`. Remove the listener when the tour ends. Update the welcome step content to mention "Press Enter or click
Next to continue."

### 10.21 Bug: Stale tour popover dialogs remain visible during step transitions (FIXED)

**Symptom:** Sometimes the previous tour popover is not hidden when the next one is shown, resulting in two (or more) overlapping popovers. For example, the "Direct NZB Download" popover stays visible alongside "Download Sent!", or both of
those remain visible alongside the current step's popover.

**Root cause:** The `goTo()` method in `angular-ui-tour.js` has no concurrency guard. When a user presses Enter rapidly, double-clicks the Next button, or uses arrow keys in quick succession, multiple `goTo()` promise chains execute
concurrently. Since `onNext` handlers can return delayed promises (e.g., the `downloadIcon` step returns a 1500ms `$timeout`), a second `goTo()` call during that window reads the same `getCurrentStep()`, fires `onNext` again, and the
resulting interleaved chains skip `hideStep()` on intermediate steps. Since popovers are never removed from the DOM (only hidden via `display: none`), any step whose `hideStep()` is skipped remains visible indefinitely.

**Fix:** Added a `transitioning` flag to the `uiTourController` in `angular-ui-tour.js`:

- `goTo()` checks `transitioning` at entry and returns `$q.reject('Transition in progress')` if already set, preventing overlapping chains.
- The flag is set to `true` before the promise chain starts, and cleared in `.finally()` after the chain completes (whether resolved or rejected).
- `startAt()` and `end()` also reset `transitioning = false` since they represent fresh navigation entry points that should override any stuck state.
- All navigation paths (`next()`, `prev()`, hotkey handlers, Enter key listener, Next/Prev buttons) funnel through `goTo()`, so the single guard protects against all sources of duplicate invocations.

### 10.22 Bug: "Shift+Click for Range" step highlights wrong checkbox — user can't click target (FIXED)

**Symptom:** The "Shift+Click for Range" step highlights the first `.result-checkbox` (same one the user just clicked), but asks the user to Shift+click a **different** checkbox further down. The backdrop covers all other checkboxes, making
it impossible to perform the action.

**Root cause:** The step's `selector: '.result-checkbox'` resolves to the first checkbox via `querySelector`, which only returns the first match. The backdrop then only exposes that single checkbox.

**Fix:** Changed the `tryShiftClick` step to dynamically highlight the 4th checkbox (index 3) instead:

- `selector` changed to `'#tour-shift-click-target'` — a temporary ID assigned at runtime.
- `onShow` handler finds all `.result-checkbox` elements, picks index 3 (or the last one if fewer exist), and assigns it `id="tour-shift-click-target"`. Since `onShow` runs before element resolution in `TourStepService.showStep()`, the
  selector finds the correct element.
- `onHide` handler removes the temporary ID to clean up.
- Content text updated to say "click **this** checkbox" since the popover now points at the actual target.
- Playwright test updated to perform the Shift+click on `#tour-shift-click-target`.

### 10.23 Final Test Results (ALL PASSING)

Automated Playwright test (`test_tour.py`) run results — both normal and stress-test modes:

**Normal mode** (`python test_tour.py`):

```
Phase 1 (Basic Search):        PASS
Phase 1→2 (Search transition): PASS
Phase 2 (Browsing Results):    PASS
Phase 3 (Single Download):     PASS
Phase 4 (Multi-Select/Bulk):   PASS
Phase 4→5 (To Movie Search):   PASS
Phase 5 (Movie Search):        PASS
Phase 5→6 (To Display Opts):   PASS
Phase 6 (Display Options):     PASS
Phase 7 (Wrap-Up):             PASS

ALL PHASES PASSED!
```

**Stress-test mode** (`python test_tour.py --debug-reset`):

```
Phase 1 (Basic Search):        PASS
Phase 1→2 (Search transition): PASS
Phase 2 (Browsing Results):    PASS  (with re-render triggers between each step)
Phase 3 (Single Download):     PASS  (with re-render triggers between each step)
Phase 4 (Multi-Select/Bulk):   PASS  (with re-render triggers between each step)
Phase 4→5 (To Movie Search):   PASS
Phase 5 (Movie Search):        PASS
Phase 5→6 (To Display Opts):   PASS
Phase 6 (Display Options):     PASS  (with re-render triggers between each step)
Phase 7 (Wrap-Up):             PASS

ALL PHASES PASSED!
```
