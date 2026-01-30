package org.nzbhydra.news;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.nzbhydra.springnative.ReflectionMarker;

@Data
@ReflectionMarker
@AllArgsConstructor
@NoArgsConstructor
public class UserNewsEntryForWeb {
    private String id;
    private String title;
    private String newsAsHtml;
}
