import axios from 'axios';
import type { ApodItem } from './apodTypes';

// axios intance congifured for NASA APOD API
const API = axios.create({
    baseURL: 'https://api.nasa.gov/planetary',
    timeout: 20000,
});

export async function getApodRange({
    startDate,
    endDate,
}: {
    startDate: string;
    endDate: string;
}): Promise<ApodItem[]> {
    const apiKey = process.env.REACT_APP_NASA_API_KEY;
    const res = await API.get('/apod', { //GET request to https://api.nasa.gov/planetary/apod
        params: {
            api_key: apiKey,
            start_date: startDate,
            end_date: endDate,
            thumbs: true, //get video thumbnails
        },
    });
    //if single obkect or array returned we normalize
    const data = Array.isArray(res.data) ? res.data : [res.data];

    //if video thumbnail avaioable 
    return data.map((it: any) => ({
        date: it.date,
        title: it.title,
        explanation: it.explanation,
        media_type: it.media_type,
        url: it.url,
        hdurl: it.hdurl,
        thumbnail_url: it.thumbnail_url || (it.media_type === 'video' ? it.url : null),
    }));
}

