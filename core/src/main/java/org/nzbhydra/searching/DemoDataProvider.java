package org.nzbhydra.searching;

import org.nzbhydra.config.ConfigProvider;
import org.nzbhydra.downloading.AddFilesRequest;
import org.nzbhydra.downloading.downloaders.AddNzbsResponse;
import org.nzbhydra.searching.dtoseventsenums.IndexerSearchMetaData;
import org.nzbhydra.searching.dtoseventsenums.SearchRequestParameters;
import org.nzbhydra.searching.dtoseventsenums.SearchResultWebTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Component
public class DemoDataProvider {

    private static final Logger logger = LoggerFactory.getLogger(DemoDataProvider.class);

    private static final String[] DEMO_INDEXERS = {"DemoIndexer1", "DemoIndexer2", "DemoIndexer3"};

    private static final String[] LINUX_TITLES = {
            "Linux.Mint.21.3.Cinnamon.x64-LiNUX",
            "Ubuntu.24.04.1.LTS.Desktop.amd64-LiNUX",
            "Arch.Linux.2024.12.01.x86_64-LiNUX",
            "Fedora.Workstation.41.x86_64-LiNUX",
            "Debian.12.8.Bookworm.amd64-LiNUX",
            "openSUSE.Tumbleweed.20241201.x86_64-LiNUX",
            "Manjaro.24.1.KDE.Plasma.x64-LiNUX",
            "Linux.Mint.22.Wilma.MATE.x64-LiNUX",
            "Pop_OS.22.04.LTS.amd64.Nvidia-LiNUX",
            "Kali.Linux.2024.4.amd64-LiNUX",
            "Elementary.OS.7.1.Horus.amd64-LiNUX",
            "Zorin.OS.17.1.Core.amd64-LiNUX",
            "Rocky.Linux.9.4.x86_64.DVD-LiNUX",
            "AlmaLinux.9.4.x86_64.DVD-LiNUX",
            "Ubuntu.Server.24.04.1.LTS.amd64-LiNUX",
            "Linux.Mint.21.3.XFCE.x64-LiNUX",
            "EndeavourOS.Galileo.Neo.x86_64-LiNUX",
            "MX.Linux.23.3.Libretto.amd64-LiNUX",
            "Tails.6.10.amd64-LiNUX",
            "Slackware.15.0.x86_64.DVD-LiNUX",
            "Gentoo.LiveGUI.amd64.20241201-LiNUX",
            "Void.Linux.20241201.x86_64.XFCE-LiNUX",
            "NixOS.24.05.x86_64-LiNUX",
            "Garuda.Linux.Dragonized.241201.x86_64-LiNUX",
            "Ubuntu.24.04.1.LTS.Desktop.amd64-LiNUX",
            "Solus.4.5.Budgie.x86_64-LiNUX",
            "antiX.23.1.x86_64.Full-LiNUX",
            "Puppy.Linux.Fossapup64.9.5-LiNUX",
            "CentOS.Stream.9.x86_64.DVD-LiNUX",
            "Mageia.9.x86_64.DVD-LiNUX"
    };

    private static final String[] INTERSTELLAR_TITLES = {
            "Interstellar.2014.1080p.BluRay.x264-SPARKS",
            "Interstellar.2014.2160p.UHD.BluRay.x265-TERMINAL",
            "Interstellar.2014.720p.BluRay.x264-YIFY",
            "Interstellar.2014.1080p.WEB-DL.DD5.1.H.264-FGT",
            "Interstellar.2014.720p.WEB-DL.DD5.1.H.264-RARBG",
            "Interstellar.2014.HDTV.x264-LOL",
            "Interstellar.2014.2160p.WEB-DL.DDP5.1.HDR.x265-NOGRP",
            "Interstellar.2014.1080p.BluRay.REMUX.AVC.DTS-HD.MA.5.1-EPSiLON",
            "Interstellar.2014.3D.1080p.BluRay.x264-SPRiNTER",
            "Interstellar.2014.BDRip.x264.AC3-PLAYNOW",
            "Interstellar.2014.720p.BluRay.x264.DTS-WiKi",
            "Interstellar.2014.1080p.BluRay.x265.HEVC.10bit.AAC.5.1-Tigole",
            "Interstellar.2014.2160p.BluRay.REMUX.HEVC.DTS-HD.MA.5.1-FGT",
            "Interstellar.2014.IMAX.Edition.1080p.BluRay.x264-BLOW",
            "Interstellar.2014.DVDRip.x264.AC3-EVO",
            "Interstellar.2014.1080p.HDTV.x264-DIMENSION",
            "Interstellar.2014.720p.HDTV.x264-IMMERSE",
            "Interstellar.2014.2160p.UHD.BluRay.HDR.x265-GUHZER",
            "Interstellar.2014.1080p.WEB-DL.DD5.1.H.264-RARBG",
            "Interstellar.2014.720p.BRRip.x264.AAC-ETRG",
            "Interstellar.2014.1080p.BluRay.x264-SPARKS",
            "Interstellar.2014.2160p.UHD.BluRay.x265-TERMINAL",
            "Interstellar.2014.1080p.BluRay.x264.DTS-HD.MA.5.1-RARBG",
            "Interstellar.2014.720p.BluRay.x264-Felony",
            "Interstellar.2014.PROPER.1080p.BluRay.x264-SADPANDA"
    };

    private static final String[] GENERIC_TITLE_TEMPLATES = {
            "%s.2024.1080p.BluRay.x264-SPARKS",
            "%s.2024.720p.WEB-DL.DD5.1.H.264-FGT",
            "%s.2024.2160p.UHD.BluRay.x265-TERMINAL",
            "%s.S01E01.1080p.WEB-DL.DD5.1.H.264-RARBG",
            "%s.S01E02.720p.HDTV.x264-LOL",
            "%s.2024.HDTV.x264-DIMENSION",
            "%s.2024.BDRip.x264.AC3-EVO",
            "%s.2024.1080p.WEB-DL.DDP5.1.x264-NOGRP",
            "%s.2024.720p.BluRay.x264-YIFY",
            "%s.2024.2160p.WEB-DL.DDP5.1.HDR.x265-NOGRP",
            "%s.v2.0.x64.Repack-DARKSIIDERS",
            "%s.2024.1080p.AMZN.WEB-DL.DDP5.1.H.264-NTb",
            "%s.Complete.Series.720p.BluRay.x264-DEMAND",
            "%s.2024.REPACK.1080p.BluRay.x264-GECKOS",
            "%s.2024.720p.BRRip.x264.AAC-ETRG",
            "%s.Discography.FLAC.Lossless-CODA",
            "%s.2024.Multi.Language.PDF-TGPDF",
            "%s.Collection.2024.1080p.BluRay.x264-ROVERS",
            "%s.2024.Proper.1080p.WEB-DL.H.264-SWTYBLZ",
            "%s.2024.720p.HDTV.x264-FLEET",
            "%s.2024.DVDRip.x264.AC3-PLAYNOW",
            "%s.2024.1080p.BluRay.REMUX.AVC.DTS-HD.MA.5.1-EPSiLON",
            "%s.2024.COMPLETE.MULTi.BLURAY-SharpHD",
            "%s.2024.German.DL.1080p.BluRay.x264-COiNCiDENCE",
            "%s.2024.FRENCH.720p.BluRay.x264-UKDHD",
            "%s.2024.iNTERNAL.1080p.BluRay.x264-MOOVEE",
            "%s.2024.1080p.NF.WEB-DL.DDP5.1.x264-MZABI",
            "%s.2024.1080p.DSNP.WEB-DL.DDP5.1.H.264-FLUX",
            "%s.2024.1080p.HMAX.WEB-DL.DD5.1.H.264-PECKAN",
            "%s.2024.Season.1.S01.1080p.AMZN.WEB-DL.DDP5.1.H.264-MADSKY"
    };

    // Sizes in bytes - range from ~350 MB to ~15 GB
    private static final long[] SIZES_BYTES = {
            367001600L,     // ~350 MB
            734003200L,     // ~700 MB
            943718400L,     // ~900 MB
            1288490188L,    // ~1.2 GB
            1610612736L,    // ~1.5 GB
            2147483648L,    // ~2.0 GB
            2684354560L,    // ~2.5 GB
            3221225472L,    // ~3.0 GB
            4294967296L,    // ~4.0 GB
            5368709120L,    // ~5.0 GB
            6442450944L,    // ~6.0 GB
            7516192768L,    // ~7.0 GB
            8589934592L,    // ~8.0 GB
            10737418240L,   // ~10.0 GB
            12884901888L,   // ~12.0 GB
            16106127360L    // ~15.0 GB
    };

    private static final String[] MOVIE_CATEGORIES = {"Movies", "Movies HD", "Movies UHD", "Movies SD", "Movies BluRay"};
    private static final String[] PC_CATEGORIES = {"PC", "PC/ISO", "PC/0day"};
    private static final String[] ALL_CATEGORIES = {"TV", "TV HD", "TV SD", "Movies", "Movies HD", "PC", "Audio", "Audio/MP3", "Audio/FLAC", "Books/EBook"};

    private static final Map<String, Integer> QUALITY_MAP = new HashMap<>();

    static {
        QUALITY_MAP.put("2160p", 10);
        QUALITY_MAP.put("1080p", 8);
        QUALITY_MAP.put("720p", 7);
        QUALITY_MAP.put("HDTV", 6);
        QUALITY_MAP.put("DVDRip", 5);
        QUALITY_MAP.put("BDRip", 4);
        QUALITY_MAP.put("BRRip", 4);
    }

    private static final String[] MOCK_CATEGORIES_DOWNLOADER = {"Default", "Movies", "TV", "Audio", "Software", "Games"};

    @Autowired
    private ConfigProvider configProvider;

    /**
     * Generates a mock SearchResponse with realistic results for the guided tour.
     */
    public SearchResponse generateSearchResponse(SearchRequestParameters params) {
        Random random = new Random(42); // Fixed seed for reproducible results
        Instant now = Instant.now();

        boolean isMovieSearch = isMovieCategory(params.getCategory());
        String query = params.getQuery() != null ? params.getQuery() : "";

        String[] titlesToUse;
        String[] categoriesToUse;

        if (isMovieSearch || query.toLowerCase().contains("interstellar")) {
            titlesToUse = INTERSTELLAR_TITLES;
            categoriesToUse = MOVIE_CATEGORIES;
        } else if (query.toLowerCase().contains("linux")) {
            titlesToUse = LINUX_TITLES;
            categoriesToUse = PC_CATEGORIES;
        } else {
            // Generic: use query in title templates
            String formattedQuery = query.isEmpty() ? "Example" : query.replace(" ", ".");
            titlesToUse = new String[30];
            for (int i = 0; i < 30; i++) {
                titlesToUse[i] = String.format(GENERIC_TITLE_TEMPLATES[i % GENERIC_TITLE_TEMPLATES.length], formattedQuery);
            }
            categoriesToUse = ALL_CATEGORIES;
        }

        int resultCount = Math.min(30, titlesToUse.length);
        List<SearchResultWebTO> results = new ArrayList<>();

        // Indices for duplicate hashes (to demonstrate grouping)
        // Items at indices 0, 3, 10 share hash; items at 1, 7 share hash
        int[] duplicateGroup1 = {0, 3, 10};
        int[] duplicateGroup2 = {1, 7};
        int hash1 = 111111;
        int hash2 = 222222;

        for (int i = 0; i < resultCount; i++) {
            String title = titlesToUse[i % titlesToUse.length];
            String indexer = DEMO_INDEXERS[i % DEMO_INDEXERS.length];
            long size = SIZES_BYTES[random.nextInt(SIZES_BYTES.length)];
            String category = categoriesToUse[random.nextInt(categoriesToUse.length)];

            // Age: between 1 hour and 30 days
            int ageMinutes = 60 + random.nextInt(30 * 24 * 60);
            Instant pubDate = now.minus(ageMinutes, ChronoUnit.MINUTES);
            long epoch = pubDate.getEpochSecond();

            String ageStr = formatAge(ageMinutes);

            // Hash for duplicate grouping
            int hash;
            if (contains(duplicateGroup1, i)) {
                hash = hash1;
            } else if (contains(duplicateGroup2, i)) {
                hash = hash2;
            } else {
                hash = 300000 + i;
            }

            // Quality rating for movie searches
            Integer qualityRating = null;
            if (isMovieSearch && configProvider.getBaseConfig().getSearching().isShowMovieQualityIndicator()) {
                qualityRating = extractQualityRating(title);
            }

            int grabs = 10 + random.nextInt(5000);

            SearchResultWebTO result = SearchResultWebTO.builder()
                    .title(title)
                    .indexer(indexer)
                    .indexerguid("DEMO-" + i)
                    .indexerscore(random.nextInt(10))
                    .size(size)
                    .age(ageStr)
                    .age_precise(false)
                    .epoch(epoch)
                    .date(pubDate.toString())
                    .hash(hash)
                    .grabs(grabs)
                    .category(category)
                    .link("internalapi/nzb/demo-" + i)
                    .details_link("#")
                    .downloadType("NZB")
                    .searchResultId(String.valueOf(10001 + i))
                    .source(isMovieSearch ? extractSource(title) : null)
                    .qualityRating(qualityRating)
                    .hasNfo("NO")
                    .build();

            results.add(result);
        }

        // Build IndexerSearchMetaData for 3 fake indexers
        List<IndexerSearchMetaData> metaDatas = new ArrayList<>();
        for (String indexerName : DEMO_INDEXERS) {
            IndexerSearchMetaData meta = new IndexerSearchMetaData();
            meta.setIndexerName(indexerName);
            meta.setDidSearch(true);
            meta.setWasSuccessful(true);
            meta.setNumberOfFoundResults(8 + random.nextInt(15));
            meta.setNumberOfAvailableResults(meta.getNumberOfFoundResults());
            meta.setResponseTime(200 + random.nextInt(1800));
            meta.setTotalResultsKnown(true);
            meta.setHasMoreResults(false);
            meta.setOffset(0);
            metaDatas.add(meta);
        }

        // Sample rejection reasons
        Map<String, Integer> rejectedReasonsMap = new HashMap<>();
        rejectedReasonsMap.put("Duplicate", 5);
        rejectedReasonsMap.put("Size too small", 2);
        rejectedReasonsMap.put("Forbidden word in title", 1);

        SearchResponse response = new SearchResponse();
        response.setSearchResults(results);
        response.setIndexerSearchMetaDatas(metaDatas);
        response.setRejectedReasonsMap(rejectedReasonsMap);
        response.setNumberOfAvailableResults(resultCount + 8);
        response.setNumberOfAcceptedResults(resultCount);
        response.setNumberOfRejectedResults(8);
        response.setNumberOfProcessedResults(resultCount + 8);
        response.setNumberOfDuplicateResults(5);
        response.setOffset(0);
        response.setLimit(100);

        logger.info("Generated demo search response with {} results for query '{}'", resultCount, query);
        return response;
    }

    /**
     * Generates a mock successful download response for the guided tour.
     * Includes a small delay so the spinner animation is visible before the checkmark appears.
     */
    public AddNzbsResponse generateDownloadResponse(AddFilesRequest request) {
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        List<Long> addedIds = new ArrayList<>();
        for (AddFilesRequest.SearchResult sr : request.getSearchResults()) {
            try {
                addedIds.add(Long.parseLong(sr.getSearchResultId()));
            } catch (NumberFormatException e) {
                logger.warn("Could not parse demo searchResultId '{}' to Long", sr.getSearchResultId());
                addedIds.add(0L);
            }
        }

        int count = request.getSearchResults().size();
        String message = "Successfully added " + count + " NZB" + (count != 1 ? "s" : "") + " to Demo Downloader";

        return new AddNzbsResponse(true, message, addedIds, Collections.emptyList());
    }

    /**
     * Returns mock downloader categories for the guided tour.
     */
    public List<String> generateDownloaderCategories() {
        return Arrays.asList(MOCK_CATEGORIES_DOWNLOADER);
    }

    private boolean isMovieCategory(String category) {
        if (category == null) {
            return false;
        }
        String lower = category.toLowerCase();
        return lower.contains("movie") || lower.contains("film");
    }

    private Integer extractQualityRating(String title) {
        for (Map.Entry<String, Integer> entry : QUALITY_MAP.entrySet()) {
            if (title.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }

    private String extractSource(String title) {
        if (title.contains("BluRay") || title.contains("BLURAY")) {
            return "BluRay";
        } else if (title.contains("WEB-DL") || title.contains("WEB.DL")) {
            return "WEB-DL";
        } else if (title.contains("HDTV")) {
            return "HDTV";
        } else if (title.contains("DVDRip")) {
            return "DVD";
        } else if (title.contains("BDRip") || title.contains("BRRip")) {
            return "BluRay";
        } else if (title.contains("REMUX")) {
            return "BluRay REMUX";
        }
        return null;
    }

    private String formatAge(int ageMinutes) {
        if (ageMinutes < 120) {
            return ageMinutes + "m";
        }
        int hours = ageMinutes / 60;
        if (hours < 48) {
            return hours + "h";
        }
        int days = hours / 24;
        return days + "d";
    }

    private static boolean contains(int[] array, int value) {
        for (int i : array) {
            if (i == value) {
                return true;
            }
        }
        return false;
    }
}
