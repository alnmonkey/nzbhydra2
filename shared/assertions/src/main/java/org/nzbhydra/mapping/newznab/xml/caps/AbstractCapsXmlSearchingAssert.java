package org.nzbhydra.mapping.newznab.xml.caps;

import org.assertj.core.api.AbstractObjectAssert;
import org.assertj.core.util.Objects;

/**
 * Abstract base class for {@link CapsXmlSearching} specific assertions - Generated by CustomAssertionGenerator.
 */
@jakarta.annotation.Generated(value = "assertj-assertions-generator")
public abstract class AbstractCapsXmlSearchingAssert<S extends AbstractCapsXmlSearchingAssert<S, A>, A extends CapsXmlSearching> extends AbstractObjectAssert<S, A> {

    /**
     * Creates a new <code>{@link AbstractCapsXmlSearchingAssert}</code> to make assertions on actual CapsXmlSearching.
     *
     * @param actual the CapsXmlSearching we want to make assertions on.
     */
    protected AbstractCapsXmlSearchingAssert(A actual, Class<S> selfType) {
        super(actual, selfType);
    }

    /**
     * Verifies that the actual CapsXmlSearching's audioSearch is equal to the given one.
     *
     * @param audioSearch the given audioSearch to compare the actual CapsXmlSearching's audioSearch to.
     * @return this assertion object.
     * @throws AssertionError - if the actual CapsXmlSearching's audioSearch is not equal to the given one.
     */
    public S hasAudioSearch(CapsXmlSearch audioSearch) {
        // check that actual CapsXmlSearching we want to make assertions on is not null.
        isNotNull();

        // overrides the default error message with a more explicit one
        String assertjErrorMessage = "\nExpecting audioSearch of:\n  <%s>\nto be:\n  <%s>\nbut was:\n  <%s>";

        // null safe check
        CapsXmlSearch actualAudioSearch = actual.getAudioSearch();
        if (!Objects.areEqual(actualAudioSearch, audioSearch)) {
            failWithMessage(assertjErrorMessage, actual, audioSearch, actualAudioSearch);
        }

        // return the current assertion for method chaining
        return myself;
    }

    /**
     * Verifies that the actual CapsXmlSearching's bookSearch is equal to the given one.
     *
     * @param bookSearch the given bookSearch to compare the actual CapsXmlSearching's bookSearch to.
     * @return this assertion object.
     * @throws AssertionError - if the actual CapsXmlSearching's bookSearch is not equal to the given one.
     */
    public S hasBookSearch(CapsXmlSearch bookSearch) {
        // check that actual CapsXmlSearching we want to make assertions on is not null.
        isNotNull();

        // overrides the default error message with a more explicit one
        String assertjErrorMessage = "\nExpecting bookSearch of:\n  <%s>\nto be:\n  <%s>\nbut was:\n  <%s>";

        // null safe check
        CapsXmlSearch actualBookSearch = actual.getBookSearch();
        if (!Objects.areEqual(actualBookSearch, bookSearch)) {
            failWithMessage(assertjErrorMessage, actual, bookSearch, actualBookSearch);
        }

        // return the current assertion for method chaining
        return myself;
    }

    /**
     * Verifies that the actual CapsXmlSearching's movieSearch is equal to the given one.
     *
     * @param movieSearch the given movieSearch to compare the actual CapsXmlSearching's movieSearch to.
     * @return this assertion object.
     * @throws AssertionError - if the actual CapsXmlSearching's movieSearch is not equal to the given one.
     */
    public S hasMovieSearch(CapsXmlSearch movieSearch) {
        // check that actual CapsXmlSearching we want to make assertions on is not null.
        isNotNull();

        // overrides the default error message with a more explicit one
        String assertjErrorMessage = "\nExpecting movieSearch of:\n  <%s>\nto be:\n  <%s>\nbut was:\n  <%s>";

        // null safe check
        CapsXmlSearch actualMovieSearch = actual.getMovieSearch();
        if (!Objects.areEqual(actualMovieSearch, movieSearch)) {
            failWithMessage(assertjErrorMessage, actual, movieSearch, actualMovieSearch);
        }

        // return the current assertion for method chaining
        return myself;
    }

    /**
     * Verifies that the actual CapsXmlSearching's search is equal to the given one.
     *
     * @param search the given search to compare the actual CapsXmlSearching's search to.
     * @return this assertion object.
     * @throws AssertionError - if the actual CapsXmlSearching's search is not equal to the given one.
     */
    public S hasSearch(CapsXmlSearch search) {
        // check that actual CapsXmlSearching we want to make assertions on is not null.
        isNotNull();

        // overrides the default error message with a more explicit one
        String assertjErrorMessage = "\nExpecting search of:\n  <%s>\nto be:\n  <%s>\nbut was:\n  <%s>";

        // null safe check
        CapsXmlSearch actualSearch = actual.getSearch();
        if (!Objects.areEqual(actualSearch, search)) {
            failWithMessage(assertjErrorMessage, actual, search, actualSearch);
        }

        // return the current assertion for method chaining
        return myself;
    }

    /**
     * Verifies that the actual CapsXmlSearching's tvSearch is equal to the given one.
     *
     * @param tvSearch the given tvSearch to compare the actual CapsXmlSearching's tvSearch to.
     * @return this assertion object.
     * @throws AssertionError - if the actual CapsXmlSearching's tvSearch is not equal to the given one.
     */
    public S hasTvSearch(CapsXmlSearch tvSearch) {
        // check that actual CapsXmlSearching we want to make assertions on is not null.
        isNotNull();

        // overrides the default error message with a more explicit one
        String assertjErrorMessage = "\nExpecting tvSearch of:\n  <%s>\nto be:\n  <%s>\nbut was:\n  <%s>";

        // null safe check
        CapsXmlSearch actualTvSearch = actual.getTvSearch();
        if (!Objects.areEqual(actualTvSearch, tvSearch)) {
            failWithMessage(assertjErrorMessage, actual, tvSearch, actualTvSearch);
        }

        // return the current assertion for method chaining
        return myself;
    }

}