import {useEffect, useMemo, useState} from 'react'; 
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import type { ApodItem } from '../api/apodTypes';
import { getApodRange } from "../api/apodLive";
import { getCache, setCache } from "../api/cache";

//helper funcs for dates
function toDateStr(s: string) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function formatDate(d: Date) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function addDays(s: string, n: number) {
    const d = toDateStr(s);
    d.setDate(d.getDate() + n);
    return formatDate(d);
}
export default function DetailView() {
    const { date = '' } = useParams();
    const [params] = useSearchParams();
    const from = params.get('from') || 'list';

    const Start = params.get('start');
    const End = params.get('end');

    const startDate = useMemo(
        () => Start ? Start : addDays(date, -7),
        [Start, date]
    );
    const endDate = useMemo(
        () => End ? End : addDays(date, 7),
        [End, date]
    );


    const [items, setItems] = useState<ApodItem[]>([]);
    const [item, setItem] = useState<ApodItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cacheKey = `apod-${startDate}-${endDate}`;
    const navigate = useNavigate();

    useEffect(() => { //runs once, when component first loads, so like "onMount"
       let cancelled = false; //flag to track if the component is unmounted before the async operation completes
       (async () => {
            setLoading(true); //shows laoding message
            setError(null);
            try {
                //cache first
                const cached = getCache<ApodItem[]>(cacheKey);
                if (cached) {
                    if (!cancelled) setItems(cached);
                    return;
                }

                //live or mock api
                const data = await getApodRange({ startDate, endDate });
                if (!cancelled) {
                    setItems(data);
                    setItem(data.find(i => i.date === date) ?? null);
                    setCache(cacheKey, data); //save to cache
                }
            } catch (e: any) {
                if (!cancelled) setError(e.message || 'Unknown error');
            } finally {
                if (!cancelled) setLoading(false); //hides loading message
            }
       })();
        return () => { cancelled = true; }; //cleanup func that sets cancelled to true if component unmounts before async operation completes
    }, [cacheKey, date, endDate, startDate]);

    // Set current item when items or date changes
    useEffect(() => {
        if (items.length > 0) {
            setItem(items.find((i: ApodItem) => i.date === date) ?? null);
        }
    }, [items, date]);

    if (loading || !item) { //if its still loading, show this instead of list
        return <p>Loading...</p>;
    }

    //checking if APOD is image or video, to know how to render
    const isImg = item.media_type === 'image';

    //curr idx for prev/next
    const idx = items.findIndex(i => i.date === item.date);
    const next = idx < items.length - 1 ? items[idx + 1] : null;
    const prev = idx > 0 ? items[idx - 1] : null;

    return (
        <div className="detail-container">
            {/* if we navigate to gallery we can go back to the list or gallery */}
            <div className="detail-header">
                <button className="back-button" onClick={() => navigate(from === 'gallery' ? '/gallery' : '/')}>Back</button> 
                <div className ="spacer" />
                <div className ="pager">
                    <button type="button" className="btn" disabled={!prev} onClick={() => prev && navigate(`/detail/${prev.date}?from=${from}&start=${startDate}&end=${endDate}`)}>prev</button>
                    <button type="button" className="btn" disabled={!next} onClick={() => next && navigate(`/detail/${next.date}?from=${from}&start=${startDate}&end=${endDate}`)}>next</button>
                </div>
            </div>

            <h1 className="dets_title">{item.title}</h1>
            <p className="detail_meta">{item.date} - {item.media_type}</p>

            <div className="detail-img-container">
                {/* if its an image then we show <img> tag o.w show the video thumbnail with the note that the video embedding is not working rn */}
                {isImg ? (
                    <img className="detail-img" src={item.hdurl || item.url} alt={item.title} />
                ) : (
                    (item.url.includes('youtube.com') || item.url.includes('vimeo.com') || item.url.includes('youtu.be')) ? (
                    <iframe
                        title={item.title}
                        src={item.url}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="dets_video"
                    />
                ) : item.thumbnail_url ? (
                    <img className="detail-img" src={item.thumbnail_url} alt={`${item.title} Thumbnail`} />
                ) : (
                    <p>(Video embedding not supported)</p>
                )
            )}
        </div>
            <p className="detail-explanation">{item.explanation}</p>
        </div>
    );
}
