import threading


def do_thread(spark, pool_id, callback):
    spark.sparkContext.setLocalProperty("spark.scheduler.pool", str(pool_id))
    callback()
    spark.sparkContext.setLocalProperty("spark.scheduler.pool", None)


def run_as_threads(spark, func_arr):
    obj = {}
    for i in range(len(func_arr)):
        obj[i] = threading.Thread(target=do_thread, args=(spark, i, func_arr[i]))
    for i in range(len(func_arr)):
        obj[i].start()
    for i in range(len(func_arr)):
        obj[i].join()