import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { store } from '@/stores/';
import { once } from '@/utils/function';
import { Bottles, type IBottle } from '@/data/bottle';

export const useBottleStore = defineStore('bottle', () => {
    // 已解锁的漂流瓶索引
    const collectedIndices = ref<number[]>([]);
    // 未查看的漂流瓶索引
    const unreadIndices = ref<number[]>([]);

    const hasUnread = computed(() => unreadIndices.value.length > 0);

    const collectedBottles = computed(() => {
        return collectedIndices.value.map(index => ({
            ...Bottles[index],
            index
        }));
    });

    function unlockRandomBottle() {
        const availableIndices = Bottles.map((_, i) => i).filter(i => !collectedIndices.value.includes(i));
        if (availableIndices.length > 0) {
            const index = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            collectedIndices.value.push(index);
            unreadIndices.value.push(index);
            return true;
        }
        return false;
    }

    function markAsRead(index: number) {
        const i = unreadIndices.value.indexOf(index);
        if (i !== -1) {
            unreadIndices.value.splice(i, 1);
        }
    }

    function isUnread(index: number) {
        return unreadIndices.value.includes(index);
    }

    return {
        collectedIndices,
        unreadIndices,
        hasUnread,
        collectedBottles,
        unlockRandomBottle,
        markAsRead,
        isUnread
    };
});

export const useBottleStoreWithOut = once(() => useBottleStore(store));
