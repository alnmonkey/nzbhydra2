package org.nzbhydra.tour;

import org.nzbhydra.genericstorage.GenericStorage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class GuidedTourProvider {

    private static final String TOUR_HIDDEN_KEY = "guidedTourHidden";

    @Autowired
    private GenericStorage genericStorage;

    public boolean isTourHiddenForUser(String username) {
        return genericStorage.get(getStorageKey(username), Boolean.class).orElse(false);
    }

    public void setTourHiddenForUser(String username, boolean hidden) {
        genericStorage.save(getStorageKey(username), hidden);
    }

    private String getStorageKey(String username) {
        return TOUR_HIDDEN_KEY + "-" + username;
    }
}
