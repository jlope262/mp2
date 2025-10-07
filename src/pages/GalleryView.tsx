import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ApodItem } from "../api/apodTypes";
import { getApodRange } from "../api/apodLive";
import { getCache, setCache } from "../api/cache";



export default function GalleryView() {
    const [items, setItems] = useState<ApodItem[]>([]); //state var named items, basically an aray of ApodItem objects
    const [loading, setLoading] = useState(false);

    const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all'); //will keep track the state of the filter, will start at all, but can be changed to image or video
    const navigate = useNavigate(); //func to nav to other routes

    const  [startDate, setStartDate] = useState('2025-09-20'); //state var for start date, starts as 2025-09-20
    const  [endDate, setEndDate] = useState('2025-09-30'); //state var for end date, starts as 2025-09-30
    const  [error, setError] = useState<string | null>(null); 

    const cacheKey = `apod:${startDate}:${endDate}`;


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
                    setCache(cacheKey, data); //save to cache
                }
            } catch (e: any) {
                if (!cancelled) setError(e.message || 'Unknown error');
            } finally {
                if (!cancelled) setLoading(false); //hides loading message
            }
       })();
        return () => { cancelled = true; }; //cleanup func that sets cancelled to true if component unmounts before async operation completes
    }, [startDate, endDate, cacheKey]);

    if (loading) { //if its still loading, show this instead of list
        return <p>Loading...</p>;
    }
    //filterings items based on media type
    const filtered = items.filter(it =>
        filter === 'all' ? true : it.media_type === filter
    );

    //func to get the thumbnail url fo APOD item
    const thumbnails = (it: ApodItem) => 
        it.media_type === 'image' ? 
        it.url : (it.thumbnail_url || '');

    return (
        <div>
            <h1>APOD Gallery</h1>

            <div style={{ display : 'flex', gap: 10, marginBottom: 10 }}>
                <label>
                    Start Date: 
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={e => setStartDate(e.target.value)} />
                </label>
                <label>
                    End Date: 
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)} />
                </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                {(["all", "image", "video"] as const).map(f => (
                    <button 
                        key={f}
                        style={{
                            padding: '5px 10px',
                            background: f === filter ? '#ccc' : '#eee',
                            border: '1px solid #999',
                            borderRadius: 5,
                        }}
                        onClick={() => setFilter(f as 'all' | 'image' | 'video')}
                    >
                        {f[0].toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {error && <p style={{ color: 'red' }}>Error: {error}</p>}

            <div className="gallery">
                {filtered.map(it => { //looping through apod entries
                    const t = thumbnails(it);
                    return (
                        <button 
                            key={it.date} 
                        className="gallery-item" 
                        onClick={() => navigate(`/detail/${it.date}?from=gallery`)}
                        title={it.title}>
                            {t && <img className="img" src={t} alt={it.title} />} 
                            <div className="card">
                                <strong>{it.title}</strong>
                                <div className="muted">{it.date} - {it.media_type}</div>
                            </div>
                        </button>    
                    );
                })}
            </div>
            {(!loading && filtered.length === 0) && <p>No items found.</p>}
        </div>
    );
}
