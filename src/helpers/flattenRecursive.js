function recurse(arr, fn, parent = null, hierarchicalCategory = '') {
    for (let i = 0, len = arr.length; i < len; i++) {
        const item = arr[i];
        fn(item, parent, hierarchicalCategory);
        // find any value that is nested
        for (let prop in item) {
            if (item.hasOwnProperty(prop)) {
                // check if this is array/object
                if (typeof item[prop] === 'object') {
                    recurse(item[prop], fn, item, prop);
                }
            }
        }

    }
}

export function recurseLevel(arr, childAttribute, fn) {
    fn(arr);
    for (let i = 0, len = arr.length; i < len; i++) {
        const item = arr[i];
        if (item[childAttribute]) {
            recurse(item[childAttribute], childAttribute, fn);
        }
    }
}

function objectInArray(arr, fn) {
    for (let i = 0, len = arr.length; i < len; i++) {
        if (fn(arr[i])) {
            return true;
        }
    }
    return false;
}

function find(arr, childAttribute, fn) {
    let result;
    for (let i = 0, len = arr.length; i < len; i++) {
        const item = arr[i];
        // check if this passes
        if (fn(item)) {
            return item;
        }
        if (item[childAttribute]) {
            // otherwise rescurse
            result = find(item[childAttribute], childAttribute, fn);
            if (result) {
                return result;
            }
        }

    }
    return false;
}

export default function flattenDedup(attribute, subjects, idField, cb, displayProperty = 'title') {

    const tree = [];
    const seenKeys = {};

    subjects.forEach(subject => {
        recurse(subject[attribute], (item, parent, hierarchicalCategory) => {

            seenKeys[item[displayProperty]] = item[idField];

            let parentArray;
            if (parent === null) {
                parentArray = tree;
            } else {
                // find parent node
                const parentNode = find(tree, hierarchicalCategory, i => i[idField] == parent[idField]);
                if (!parentNode.children) {
                    parentNode[hierarchicalCategory] = [];
                }
                parentArray = parentNode[hierarchicalCategory];
            }

            // check if item already in parent
            if (!objectInArray(parentArray, i => i[idField] == item[idField])) {


                const attributeKey = parent ? `${parent[idField]}-${item[idField]}` : item[idField];

                // add an entry it
                parentArray.push({
                    [idField]: item[idField],
                    value: item[displayProperty],
                    count: 1,
                    attribute: attributeKey
                });

                const filterFn = subject => {
                    // find the content id
                    return find(subject[attribute], hierarchicalCategory, attr => attr[idField] === item[idField]);
                };

                cb(attributeKey, item[displayProperty], filterFn);

            } else {
                // find and increment it
                const node = find(parentArray, hierarchicalCategory, i => i[idField] == item[idField]);
                node.count++;


            }
        });
    });

    // check to make sure we don't have items with the same key
    const seen = {};
    for(let prop in seenKeys) {
        if (seenKeys.hasOwnProperty(prop)) {
            if(seen[seenKeys[prop]]) {
                throw new Error('keys on filter attributes must be unique');
            }
            seen[seenKeys[prop]] = true;
        }
    }


    return tree;
}