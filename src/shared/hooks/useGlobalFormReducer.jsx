import dayjs from 'dayjs';
import React from 'react';
import { atom } from 'jotai';

const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

export const initialFormattedTimeZone = `${dayjs.tz.guess()} UTC${dayjs().tz(dayjs.tz.guess()).format('Z')}`;

export const timezoneAtom = atom(initialFormattedTimeZone);
export const recentTimezoneAtom = atom(JSON.parse(sessionStorage.getItem('recentTimeZones')) || []);
