import { ReviewSummary } from "@/types/review";
import { Calendar } from "../ui/calendar";
import { useMemo } from "react";
import { FaCircle } from "react-icons/fa";
import { getUTCOffset } from "@/utils/dateUtil";
import { type DayContentProps } from "react-day-picker";
import { LAST_24_HOURS_KEY } from "@/types/filter";

type ReviewActivityCalendarProps = {
  reviewSummary?: ReviewSummary;
  selectedDay?: Date;
  onSelect: (day?: Date) => void;
};
export default function ReviewActivityCalendar({
  reviewSummary,
  selectedDay,
  onSelect,
}: ReviewActivityCalendarProps) {
  const disabledDates = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24, -1, 0, 0);
    const future = new Date();
    future.setFullYear(tomorrow.getFullYear() + 10);
    return { from: tomorrow, to: future };
  }, []);

  const modifiers = useMemo(() => {
    if (!reviewSummary) {
      return { alerts: [], detections: [] };
    }

    const unreviewedDetections: Date[] = [];
    const unreviewedAlerts: Date[] = [];

    Object.entries(reviewSummary).forEach(([date, data]) => {
      if (date == LAST_24_HOURS_KEY) {
        return;
      }

      const parts = date.split("-");
      const cal = new Date(date);

      cal.setFullYear(
        parseInt(parts[0]),
        parseInt(parts[1]) - 1,
        parseInt(parts[2]),
      );

      if (data.total_alert > data.reviewed_alert) {
        unreviewedAlerts.push(cal);
      } else if (data.total_detection > data.reviewed_detection) {
        unreviewedDetections.push(cal);
      }
    });

    return {
      alerts: unreviewedAlerts,
      detections: unreviewedDetections,
    };
  }, [reviewSummary]);

  return (
    <Calendar
      key={selectedDay ? selectedDay.toISOString() : "reset"}
      mode="single"
      disabled={disabledDates}
      showOutsideDays={false}
      selected={selectedDay}
      onSelect={onSelect}
      modifiers={modifiers}
      components={{
        DayContent: ReviewActivityDay,
      }}
      defaultMonth={selectedDay ?? new Date()}
    />
  );
}

function ReviewActivityDay({ date, activeModifiers }: DayContentProps) {
  const dayActivity = useMemo(() => {
    if (activeModifiers["alerts"]) {
      return "alert";
    } else if (activeModifiers["detections"]) {
      return "detection";
    } else {
      return "none";
    }
  }, [activeModifiers]);

  return (
    <div className="flex flex-col items-center justify-center gap-0.5">
      {date.getDate()}
      {dayActivity != "none" && (
        <FaCircle
          className={`size-2 ${dayActivity == "alert" ? "fill-severity_alert" : "fill-severity_detection"}`}
        />
      )}
    </div>
  );
}

type TimezoneAwareCalendarProps = {
  timezone?: string;
  selectedDay?: Date;
  onSelect: (day?: Date) => void;
};
export function TimezoneAwareCalendar({
  timezone,
  selectedDay,
  onSelect,
}: TimezoneAwareCalendarProps) {
  const timezoneOffset = useMemo(
    () =>
      timezone ? Math.round(getUTCOffset(new Date(), timezone)) : undefined,
    [timezone],
  );
  const disabledDates = useMemo(() => {
    const tomorrow = new Date();

    if (timezoneOffset) {
      tomorrow.setHours(
        tomorrow.getHours() + 24,
        tomorrow.getMinutes() + timezoneOffset,
        0,
        0,
      );
    } else {
      tomorrow.setHours(tomorrow.getHours() + 24, -1, 0, 0);
    }

    const future = new Date();
    future.setFullYear(tomorrow.getFullYear() + 10);
    return { from: tomorrow, to: future };
  }, [timezoneOffset]);

  const today = useMemo(() => {
    if (!timezoneOffset) {
      return undefined;
    }

    const date = new Date();
    const utc = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
    );
    const todayUtc = new Date(utc);
    todayUtc.setMinutes(todayUtc.getMinutes() + timezoneOffset, 0, 0);
    return todayUtc;
  }, [timezoneOffset]);

  return (
    <Calendar
      key={selectedDay ? selectedDay.toISOString() : "reset"}
      mode="single"
      disabled={disabledDates}
      showOutsideDays={false}
      today={today}
      selected={selectedDay}
      onSelect={onSelect}
      defaultMonth={selectedDay ?? new Date()}
    />
  );
}
