package org.nzbhydra.notifications;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.nzbhydra.config.BaseConfig;
import org.nzbhydra.config.ConfigProvider;
import org.nzbhydra.config.NotificationConfig;
import org.nzbhydra.config.NotificationConfigEntry;
import org.nzbhydra.config.indexer.IndexerConfig;
import org.nzbhydra.config.notification.NotificationEventType;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@MockitoSettings(strictness = Strictness.LENIENT)
public class NotificationHandlerTest {

    @Mock
    private ConfigProvider configProvider;
    @Mock
    private NotificationRepository notificationRepository;
    @Captor
    private ArgumentCaptor<NotificationEntity> notificationEntityCaptor;
    @InjectMocks
    private NotificationHandler testee = new NotificationHandler();

    private BaseConfig baseConfig = new BaseConfig();
    private NotificationConfig notificationConfig = new NotificationConfig();

    @BeforeEach
    public void setUp() {
        when(configProvider.getBaseConfig()).thenReturn(baseConfig);
        baseConfig.setNotificationConfig(notificationConfig);
        notificationConfig.setAppriseType(NotificationConfig.AppriseType.NONE);
        notificationConfig.setFilterOuts(Collections.emptyList());
    }

    @Test
    public void shouldTruncateBodyTo255Characters() {
        // Given a long notification body that exceeds 255 characters
        String longBody = "A".repeat(300);
        NotificationConfigEntry entry = new NotificationConfigEntry();
        entry.setEventType(NotificationEventType.INDEXER_DISABLED);
        entry.setBodyTemplate(longBody);
        entry.setMessageType(NotificationConfigEntry.MessageType.WARNING);
        notificationConfig.setEntries(List.of(entry));

        NotificationEvent event = new IndexerDisabledNotificationEvent("test", IndexerConfig.State.ENABLED, "message");

        // When handling the notification
        testee.handleNotification(event);

        // Then the saved notification body should be truncated to 255 characters
        verify(notificationRepository).save(notificationEntityCaptor.capture());
        NotificationEntity savedEntity = notificationEntityCaptor.getValue();
        assertThat(savedEntity.getBody()).hasSize(255);
        assertThat(savedEntity.getBody()).isEqualTo("A".repeat(255));
    }

    @Test
    public void shouldNotTruncateBodyWhenUnder255Characters() {
        // Given a notification body under 255 characters
        String shortBody = "Short notification body";
        NotificationConfigEntry entry = new NotificationConfigEntry();
        entry.setEventType(NotificationEventType.INDEXER_DISABLED);
        entry.setBodyTemplate(shortBody);
        entry.setMessageType(NotificationConfigEntry.MessageType.INFO);
        notificationConfig.setEntries(List.of(entry));

        NotificationEvent event = new IndexerDisabledNotificationEvent("test", IndexerConfig.State.ENABLED, "message");

        // When handling the notification
        testee.handleNotification(event);

        // Then the saved notification body should remain unchanged
        verify(notificationRepository).save(notificationEntityCaptor.capture());
        NotificationEntity savedEntity = notificationEntityCaptor.getValue();
        assertThat(savedEntity.getBody()).isEqualTo(shortBody);
    }
}
