import { ActivityIndicator, Text, View } from 'react-native';
import { OrderStatusLogFull }           from '@/services/orders.service';
import { useOrderStatusLogs }           from '@/hooks/useOrderStatusLogs';
import { COLORS, FONT_SIZES, RADIUS, SPACING, STATUS_COLOR, STATUS_LABEL } from '@/lib/theme';

// ---------------------------------------------------------------------------
// Single timeline row
// ---------------------------------------------------------------------------

function TimelineRow({
  log, isLast,
}: {
  log:    OrderStatusLogFull;
  isLast: boolean;
}) {
  const color = STATUS_COLOR[log.to_status] ?? COLORS.muted;
  const ts    = new Date(log.timestamp).toLocaleString('en-PK', {
    day:    'numeric',
    month:  'short',
    hour:   '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
      {/* Dot + line column */}
      <View style={{ alignItems: 'center', width: 20 }}>
        <View style={{
          width:           12,
          height:          12,
          borderRadius:    RADIUS.full,
          backgroundColor: color,
          marginTop:       3,
        }} />
        {!isLast && (
          <View style={{ width: 2, flex: 1, backgroundColor: COLORS.border, marginTop: 3 }} />
        )}
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingBottom: isLast ? 0 : SPACING.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, flexWrap: 'wrap' }}>
          <View style={{
            backgroundColor:   color + '18',
            borderRadius:      RADIUS.sm,
            paddingHorizontal: 7,
            paddingVertical:   2,
          }}>
            <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color }}>
              {STATUS_LABEL[log.to_status] ?? log.to_status}
            </Text>
          </View>
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginLeft: 'auto' }}>
            {ts}
          </Text>
        </View>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 3 }}>
          {log.actor_name}
          {log.reason ? ` · ${log.reason}` : ''}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

interface Props {
  orderId: number;
}

export function StatusTimeline({ orderId }: Props) {
  const { data: logs = [], isLoading } = useOrderStatusLogs(orderId);

  return (
    <View style={{
      backgroundColor: COLORS.surface,
      borderRadius:    RADIUS.md,
      borderWidth:     1,
      borderColor:     COLORS.border,
      padding:         SPACING.md,
    }}>
      {isLoading ? (
        <ActivityIndicator color={COLORS.muted} size="small" />
      ) : logs.length === 0 ? (
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, textAlign: 'center' }}>
          No status history found.
        </Text>
      ) : (
        logs.map((log, i) => (
          <TimelineRow key={log.id} log={log} isLast={i === logs.length - 1} />
        ))
      )}
    </View>
  );
}
