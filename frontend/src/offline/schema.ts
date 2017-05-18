interface NetworkItem {
    id?: number;
    status: string;
}

interface SyncItem {
    id?: number;
    url: string;
    data: any;
}

export { NetworkItem, SyncItem };
