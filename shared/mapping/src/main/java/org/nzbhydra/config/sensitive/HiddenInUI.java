package org.nzbhydra.config.sensitive;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a field that should be hidden in the UI.
 * When loading config for display, fields with this annotation will be replaced
 * with a placeholder marker (***UNCHANGED***) to prevent exposing sensitive values.
 * <p>
 * This is different from @SensitiveData which marks fields for log masking and encryption.
 * A field can have both annotations if it should be both hidden in UI and masked in logs.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface HiddenInUI {
}
