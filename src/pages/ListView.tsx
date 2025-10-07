import {useEffect, useState} from 'react'; //useState are built-in hooks that lets components remebrevalues over time, useEffects lets run code after rendering
import type { ApodItem } from '../api/apodTypes';
import { useNavigate } from 'react-router-dom';
import { getApodRange } from '../api/apodLive';
import { getCache, setCache } from '../api/cache';


function Controls({ 
    startDate, 
    setStartDate, 
    endDate, 
    setEndDate, 
    search, 
    setSearch, 
    sortBy, 
    setSortBy, 
    order, 
    setOrder 
}: {
    startDate: string;
    setStartDate: (date: string) => void;
    endDate: string;
    setEndDate: (date: string) => void;
    search: string;
    setSearch: (search: string) => void;
    sortBy: 'date' | 'title';
    setSortBy: (sortBy: 'date' | 'title') => void;
    order: 'asc' | 'desc';
    setOrder: (order: 'asc' | 'desc') => void;
}) {
    return ( //what actually shows on screen all of this is jsx, which looks like html but is js
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
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
            <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)} //when user types in the input, this func is called, e is the event object, e.target is the input element, e.target.value is the curr text in the input, call setSearch with that value to update the search state var
            />
            <select value ={sortBy} onChange={e => setSortBy(e.target.value as 'date' | 'title')}>
                <option value="date">Sort by Date</option>
                <option value="title">Sort by Title</option>
            </select>
            <button onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}>
                {order === 'asc' ? 'Asc' : 'Desc'}
            </button>
        </div>
    );
}

export default function ListView() { //this is declaring a react component, reusable piece of UI, everything inside is the logic & markup for that screen
    const [items, setItems] = useState<ApodItem[]>([]); //state var named items, basically an aray of ApodItem objects, starts with an empty arr, when we call the mock PAI loads we render the list with the data.
    const [loading, setLoading] = useState(false); //keeps track if data is beign loaded, set to true before laoding, false after done
    const [error, setError] = useState<string | null>(null); //state var for any error message, starts as null, if error occurs we set it to the error message

    const [startDate, setStartDate] = useState('2025-09-20'); //state var for start date, starts as 2025-09-20
    const [endDate, setEndDate] = useState('2025-09-30'); //state var for end date, starts as 2025-09-30
    
    const navigate = useNavigate(); //func to nav to other routes

    const [search, setSearch] = useState(''); //state var for search term, starts as empty string, okay so search = the curr test in the search input so starts as '', setSearch = func that changes such
    const [sortBy, setSortBy] = useState<'date' | 'title'>('date'); //storing either date or title, as the curr sort field, using state hook
    const [order, setOrder] = useState<'asc' | 'desc'>('desc'); //state var for order, can be asc or desc, starts as desc

    const cacheKey = `apod-${startDate}-${endDate}`; //key for caching, based on the start and end date

    useEffect(() => { //runs once, when component first loads, so like "onMount"
       let cancelled = false; //flag to track if the component is unmounted before the async operation completes
       (async () => {
            setLoading(true); //shows laoding message
            setError(null);
            try {
                //cache first
                const cached = getCache<ApodItem[]>(cacheKey);
                if (cached) {
                    if (!cancelled) {
                        setItems(cached);
                        setLoading(false);
                    }
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

    //unused error had to fix
    if (error) {
        return <p>Error: {error}</p>;
    }
    //filter by search, so i only care about items that match the search term
    const filtered = items.filter(it =>
        it.title.toLowerCase().includes(search.toLowerCase()) ||
        it.explanation.toLowerCase().includes(search.toLowerCase())
    );

    //sort
    const sorted = [...filtered].sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'date') {
            cmp = a.date.localeCompare(b.date);
        } else {
            cmp = a.title.localeCompare(b.title);
        }
        return order === 'asc' ? cmp : -cmp;
    });

    return (
        <div>
            <h1>APOD List</h1>
            {/* list */}
            <Controls 
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                search={search}
                setSearch={setSearch}
                sortBy={sortBy}
                setSortBy={setSortBy}
                order={order}
                setOrder={setOrder}
            />
            {sorted.length === 0 ? (
                <p>No items found.</p>
            ) : (
                <ul className="list">
                    {sorted.map(item => (
                        <li key ={item.date}>
                            <button onClick={() => navigate(`/detail/${item.date}?from=list&start=${startDate}&end=${endDate}`)}>
                                {item.date} - {item.title}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}